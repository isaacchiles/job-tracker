import { startOfDay, parseISO, isBefore, format } from 'date-fns';
import type {
  AppData,
  Company,
  Opportunity,
  Task,
  DeleteCompanySummary,
} from './types';

/**
 * Generate a v4 UUID.
 *
 * `crypto.randomUUID()` requires a secure context, and `file://` (how the
 * single-file JobTracker.html is opened) is NOT secure in some browsers, where
 * `crypto.randomUUID` can be undefined. Feature-detect and fall back to a
 * getRandomValues-based v4 UUID (or Math.random as a last resort).
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // RFC 4122 §4.4: set version (4) and variant (10xx) bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Get the "next action" for an opportunity: the earliest-due undone task (nulls last).
 */
export function getNextActionForOpp(opp: Opportunity | string, data?: AppData): Task | null {
  let tasks: Task[] = [];
  if (typeof opp === 'string') {
    if (!data) return null;
    const found = data.opportunities.find(o => o.id === opp);
    if (!found) return null;
    tasks = found.tasks;
  } else {
    tasks = opp.tasks;
  }
  const open = tasks.filter(t => !t.done);
  if (open.length === 0) return null;
  // Sort: by due asc (nulls last), then created
  return open.sort((a, b) => {
    if (!a.due && !b.due) return a.created_at.localeCompare(b.created_at);
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due);
  })[0] || null;
}

/**
 * Is task overdue? (not done and due date before today)
 */
export function isOverdue(task: Task): boolean {
  if (task.done || !task.due) return false;
  try {
    const dueDate = parseISO(task.due);
    return isBefore(dueDate, startOfDay(new Date()));
  } catch {
    return false;
  }
}

/**
 * Format headcount for display (buckets or exact)
 */
export function formatHeadcount(headcount: number | null): string {
  if (headcount == null) return 'Unknown';
  if (headcount <= 10) return '1-10';
  if (headcount <= 50) return '11-50';
  if (headcount <= 200) return '51-200';
  if (headcount <= 500) return '201-500';
  if (headcount <= 2000) return '501-2000';
  return '2000+';
}

/**
 * Get opportunities for a company (primary + optionally via)
 */
export function getOppsForCompany(data: AppData, companyId: string, options: { includeVia?: boolean } = {}): Opportunity[] {
  const { includeVia = true } = options;
  return data.opportunities.filter(opp =>
    opp.company_id === companyId || (includeVia && opp.via_company_id === companyId)
  );
}

/**
 * Compute delete summary for a company (pure, for preview + execution)
 */
export function computeDeleteSummary(data: AppData, companyId: string): DeleteCompanySummary {
  const primaryOpps = data.opportunities.filter(o => o.company_id === companyId);
  const viaOpps = data.opportunities.filter(o => o.via_company_id === companyId && o.company_id !== companyId);

  const company = data.companies.find(c => c.id === companyId);
  const contactIdsToRemove = new Set((company?.contacts || []).map(c => c.id));

  const affectedOppIds = [...primaryOpps.map(o => o.id), ...viaOpps.map(o => o.id)];

  // Count how many contact links would be cleaned in remaining opps
  let cleanedContactLinks = 0;
  data.opportunities.forEach(opp => {
    if (!affectedOppIds.includes(opp.id)) {
      const before = opp.contact_ids.length;
      const after = opp.contact_ids.filter(id => !contactIdsToRemove.has(id)).length;
      cleanedContactLinks += (before - after);
    }
  });

  return {
    companyId,
    removedPrimaryOpps: primaryOpps.length,
    nulledViaOpps: viaOpps.length,
    deletedContacts: (company?.contacts || []).length,
    cleanedContactLinks,
    affectedOppIds,
  };
}

/**
 * Perform the actual delete logic on a copy of data (pure)
 */
export function applyDeleteCompany(data: AppData, companyId: string): { newData: AppData; summary: DeleteCompanySummary } {
  const summary = computeDeleteSummary(data, companyId);
  const company = data.companies.find(c => c.id === companyId);
  const contactIdsToRemove = new Set((company?.contacts || []).map(c => c.id));

  let newOpps = data.opportunities.filter(o => o.company_id !== companyId); // remove primary
  newOpps = newOpps.map(opp => {
    if (opp.via_company_id === companyId) {
      return { ...opp, via_company_id: null, updated_at: new Date().toISOString() };
    }
    // clean contact links
    const newContactIds = opp.contact_ids.filter(id => !contactIdsToRemove.has(id));
    if (newContactIds.length !== opp.contact_ids.length) {
      return { ...opp, contact_ids: newContactIds, updated_at: new Date().toISOString() };
    }
    return opp;
  });

  const newCompanies = data.companies.filter(c => c.id !== companyId);

  const newData: AppData = {
    ...data,
    companies: newCompanies,
    opportunities: newOpps,
  };

  return { newData, summary };
}

/**
 * Merge logic (private, used by importData)
 * See exact semantics in DESIGN.md
 */
export function mergeData(current: AppData, incoming: AppData): { result: AppData; warnings: string[] } {
  const warnings: string[] = [];

  // Companies merge by id
  const companyMap = new Map(current.companies.map(c => [c.id, c]));
  const mergedCompanies: Company[] = [...current.companies];

  for (const inc of incoming.companies) {
    const existing = companyMap.get(inc.id);
    if (!existing) {
      mergedCompanies.push(inc);
    } else if (inc.updated_at > existing.updated_at) {
      // replace with incoming (including its contacts)
      const idx = mergedCompanies.findIndex(c => c.id === inc.id);
      mergedCompanies[idx] = inc;
      warnings.push(`Company ${inc.name} updated from incoming (later updated_at)`);
    }
  }

  // Opportunities merge by id
  const oppMap = new Map(current.opportunities.map(o => [o.id, o]));
  const mergedOpps: Opportunity[] = [...current.opportunities];

  for (const inc of incoming.opportunities) {
    const existing = oppMap.get(inc.id);
    if (!existing) {
      mergedOpps.push(inc);
    } else if (inc.updated_at > existing.updated_at) {
      const idx = mergedOpps.findIndex(o => o.id === inc.id);
      mergedOpps[idx] = inc;
      warnings.push(`Opportunity ${inc.role_title} updated from incoming`);
    }
  }

  // Post-merge cleanup: remove dangling via_company_id and contact_ids
  const validCompanyIds = new Set(mergedCompanies.map(c => c.id));
  const validContactIds = new Set(mergedCompanies.flatMap(c => c.contacts.map(ct => ct.id)));

  let danglingCleaned = 0;
  const finalOpps = mergedOpps.map(opp => {
    let changed = false;
    let newVia = opp.via_company_id;
    if (newVia && !validCompanyIds.has(newVia)) {
      newVia = null;
      changed = true;
    }
    const newContactIds = opp.contact_ids.filter(id => {
      if (!validContactIds.has(id)) {
        danglingCleaned++;
        return false;
      }
      return true;
    });
    if (newContactIds.length !== opp.contact_ids.length) changed = true;

    if (changed) {
      return {
        ...opp,
        via_company_id: newVia,
        contact_ids: newContactIds,
        updated_at: new Date().toISOString(),
      };
    }
    return opp;
  });

  if (danglingCleaned > 0) {
    warnings.push(`${danglingCleaned} dangling contact links cleaned during merge`);
  }

  const result: AppData = {
    version: 1,
    companies: mergedCompanies,
    opportunities: finalOpps,
    meta: {
      ...current.meta,
      ...incoming.meta,
    },
  };

  return { result, warnings };
}

/**
 * Simple dupe check for company (soft warning)
 */
export function findSimilarCompany(data: AppData, name: string, website: string | null): Company | undefined {
  const lowerName = name.toLowerCase().trim();
  const lowerWebsite = website?.toLowerCase().trim();
  return data.companies.find(c => {
    const cName = c.name.toLowerCase().trim();
    if (cName === lowerName) return true;
    if (lowerWebsite && c.website && c.website.toLowerCase().trim() === lowerWebsite) return true;
    // fuzzy: name contains or vice versa
    if (cName.includes(lowerName) || lowerName.includes(cName)) return true;
    return false;
  });
}

/**
 * Format date for display (relative or short)
 */
export function formatDateShort(iso: string | null): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}
