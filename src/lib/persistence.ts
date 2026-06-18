import { AppDataSchema, type AppData, type ImportResult } from './types';
import { mergeData, generateId } from './utils';

const STORAGE_KEY = 'jobtracker:data';
const EXPORT_FILENAME_PREFIX = 'jobtracker-backup';

export function loadFromStorage(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    try {
      return AppDataSchema.parse(parsed);
    } catch (schemaErr) {
      console.warn('Schema validation failed, attempting best-effort recovery from old/corrupt data:', schemaErr);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.companies) && Array.isArray(parsed.opportunities)) {
        // Recover what we can; sub-entities may be partial but UI should tolerate
        const recovered: AppData = {
          version: 1,
          companies: parsed.companies || [],
          opportunities: parsed.opportunities || [],
          meta: parsed.meta || {},
        };
        return recovered;
      }
      return null;
    }
  } catch (e) {
    console.warn('Failed to load from storage (corrupt or old schema):', e);
    // For important user data: never silently delete. Return null so app can warn and offer recovery.
    // User should rely on their manual exports / "Save to file" for safety.
    return null;
  }
}

export function saveToStorage(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
    // In real app could show toast, but here caller handles
  }
}

export function exportData(data: AppData): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${EXPORT_FILENAME_PREFIX}-${timestamp}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // NOTE: this function is intentionally pure with respect to `data` — it only
  // triggers the download. The store owns the `meta.last_exported_at` stamp via
  // its `set(...)`, so we must not mutate the passed-in (live Zustand) object here.
}

/**
 * Core import logic. Public surface.
 * Always validate first (Zod). Never mutate on failure.
 */
export function importData(
  current: AppData,
  incomingRaw: unknown,
  mode: 'replace' | 'merge',
): { result: ImportResult; data: AppData } {
  let warnings: string[] = [];
  let versionMigrated = false;

  // Validate incoming (throws on invalid; we never mutate on failure).
  let incoming: AppData;
  try {
    incoming = AppDataSchema.parse(incomingRaw);
  } catch (e: any) {
    throw new Error(`Invalid data file: ${e.message || 'Schema validation failed'}`);
  }

  // Build the stored data from the *raw* (validated-but-not-stripped) object so
  // that unknown / forward-compatible fields are preserved, matching prior
  // behavior. `incoming` (the parsed copy) is used only for version checks.
  const incomingForData = incomingRaw as AppData;

  // Version handling (additive)
  if (incoming.version !== 1) {
    // For future versions we could migrate fields
    if (incoming.version > 1) {
      warnings.push('Incoming data has newer schema version. Some fields may be ignored on replace/merge.');
    }
    versionMigrated = true;
  }

  let resultData: AppData;
  let stats: Partial<ImportResult> = {
    companiesAdded: 0,
    companiesUpdated: 0,
    opportunitiesAdded: 0,
    opportunitiesUpdated: 0,
    contactsAdded: 0,
    contactsUpdated: 0,
    tasksAdded: 0,
    tasksUpdated: 0,
    meetingsAdded: 0,
    meetingsUpdated: 0,
  };

  if (mode === 'replace') {
    resultData = {
      ...incomingForData,
      version: 1,
      meta: { ...(incomingForData.meta || {}), last_exported_at: new Date().toISOString() },
    };
    // Count as added for replace
    stats.companiesAdded = resultData.companies.length;
    stats.opportunitiesAdded = resultData.opportunities.length;
    // Rough contact/task/meeting counts
    resultData.companies.forEach(c => { stats.contactsAdded! += c.contacts.length; });
    resultData.opportunities.forEach(o => {
      stats.tasksAdded! += o.tasks.length;
      stats.meetingsAdded! += o.meetings.length;
    });
  } else {
    // Merge
    const { result, warnings: mergeWarnings } = mergeData(current, incomingForData);
    resultData = {
      ...result,
      meta: { ...(result.meta || {}), last_exported_at: new Date().toISOString() },
    };
    warnings = [...warnings, ...mergeWarnings];

    // Compute rough stats (simplified - real diff would be more precise but sufficient)
    const beforeCompCount = current.companies.length;
    const beforeOppCount = current.opportunities.length;

    stats.companiesAdded = Math.max(0, resultData.companies.length - beforeCompCount);
    stats.companiesUpdated = Math.min(beforeCompCount, resultData.companies.length) - (resultData.companies.length - stats.companiesAdded); // rough
    // For demo purposes use added/updated heuristics
    stats.opportunitiesAdded = Math.max(0, resultData.opportunities.length - beforeOppCount);
  }

  // Always bump updated meta
  resultData.meta = resultData.meta || {};

  const importResult: ImportResult = {
    mode,
    replaced: mode === 'replace',
    companiesAdded: stats.companiesAdded || 0,
    companiesUpdated: stats.companiesUpdated || 0,
    opportunitiesAdded: stats.opportunitiesAdded || 0,
    opportunitiesUpdated: stats.opportunitiesUpdated || 0,
    contactsAdded: stats.contactsAdded || 0,
    contactsUpdated: stats.contactsUpdated || 0,
    tasksAdded: stats.tasksAdded || 0,
    tasksUpdated: stats.tasksUpdated || 0,
    meetingsAdded: stats.meetingsAdded || 0,
    meetingsUpdated: stats.meetingsUpdated || 0,
    versionMigrated,
    warnings,
  };

  return { result: importResult, data: resultData };
}

/**
 * Prepare a full safe data object (used internally before mutations in store)
 */
export function createEmptyData(): AppData {
  return {
    version: 1,
    companies: [],
    opportunities: [],
    meta: {},
  };
}

/**
 * Seed with realistic sample data (covers via_company, AI native, tasks, meetings, contacts)
 */
export function createSampleData(): AppData {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString();

  const acmeId = generateId();
  const idrId = generateId();
  const opp1Id = generateId();
  const contact1Id = generateId();

  return {
    version: 1,
    companies: [
      {
        id: acmeId,
        name: 'Acme AI',
        website: 'https://acme.ai',
        industry: 'AI Infrastructure',
        funding_stage: 'Startup',
        headcount: 180,
        ai_native: true,
        is_contractor: false,
        hq_location: 'San Francisco, CA',
        notes: 'Strong engineering culture. Focus on inference optimization.',
        created_at: '2026-01-10T09:00:00.000Z',
        updated_at: now,
        contacts: [
          {
            id: contact1Id,
            name: 'Priya Sharma',
            title: 'Engineering Manager, ML Platform',
            linkedin: 'https://linkedin.com/in/priyasharma',
            notes: 'Met at NeurIPS. Referred me for role.',
            created_at: now,
            updated_at: now,
          },
        ],
      },
      {
        id: idrId,
        name: 'IDR Staffing',
        website: 'https://idr.example',
        industry: 'Staffing & Recruiting',
        funding_stage: 'Private',
        headcount: 450,
        ai_native: false,
        is_contractor: true,
        hq_location: 'New York, NY',
        notes: 'Contractor placement for tech roles. Used for some startups.',
        created_at: '2026-01-15T10:00:00.000Z',
        updated_at: now,
        contacts: [],
      },
    ],
    opportunities: [
      {
        id: opp1Id,
        company_id: acmeId,
        via_company_id: null,
        role_title: 'Senior ML Engineer - Inference',
        role_type: 'Full-time',
        stage: 'Interviewing',
        job_url: 'https://acme.ai/careers/123',
        location: 'SF / Hybrid',
        source: 'Referral',
        priority: 'High',
        ote: 235000,
        equity: '0.08% over 4 years',
        title_bump: 'Medium',
        work_mode: 'Hybrid',
        why_interested: 'Leading work on efficient inference at scale + great comp.',
        notes: 'Additional context: referred by alumni; open to discussing remote-first options.',
        applied_at: '2026-02-03T00:00:00.000Z',
        created_at: '2026-02-01T11:30:00.000Z',
        updated_at: now,
        tasks: [
          {
            id: generateId(),
            title: 'Prep system design for inference serving',
            due: tomorrow.split('T')[0],
            done: false,
            created_at: now,
            updated_at: now,
          },
          {
            id: generateId(),
            title: 'Send thank you to Priya',
            due: yesterday.split('T')[0],
            done: true,
            created_at: now,
            updated_at: now,
          },
        ],
        meetings: [
          {
            id: generateId(),
            date: '2026-02-10T14:00:00.000Z',
            type: 'Video',
            attendees: 'Priya Sharma (EM), Alex Rivera (Staff SWE)',
            notes: 'Discussed current inference stack and team growth plans.',
            outcome: 'Strong interest. Onsite scheduled for next week.',
            created_at: now,
            updated_at: now,
          },
        ],
        contact_ids: [contact1Id],
      },
      {
        id: generateId(),
        company_id: acmeId,
        via_company_id: idrId, // via staffing
        role_title: 'ML Engineer (Contract-to-hire)',
        role_type: 'Contract',
        stage: 'Applied',
        job_url: null,
        location: 'Remote',
        source: 'LinkedIn',
        priority: 'Medium',
        ote: 180000,
        equity: 'TBD',
        title_bump: 'Same',
        work_mode: 'Remote',
        why_interested: 'Good way to get foot in door at Acme.',
        notes: '',
        applied_at: '2026-02-12T00:00:00.000Z',
        created_at: '2026-02-12T09:00:00.000Z',
        updated_at: now,
        tasks: [
          {
            id: generateId(),
            title: 'Complete IDR paperwork',
            due: null,
            done: false,
            created_at: now,
            updated_at: now,
          },
        ],
        meetings: [],
        contact_ids: [],
      },
    ],
    meta: {
      last_exported_at: now,
    },
  };
}

/**
 * Download helper (used by store)
 */
export function downloadJSON(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- File handle persistence via IndexedDB (for auto-save to user's chosen file) ---
// This makes "Save to file" more reliable across sessions/reloads/sleep.
// Handles are stored per-origin (works for http and file:// in supporting browsers like Chrome/Edge).

const IDB_DB_NAME = 'jobtracker';
const IDB_STORE_NAME = 'fileHandles';
const HANDLE_KEY = 'currentBackupFile';

let idbPromise: Promise<IDBDatabase> | null = null;

function getIDB(): Promise<IDBDatabase> {
  if (!idbPromise) {
    idbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return idbPromise;
}

export async function saveFileHandle(handle: FileSystemFileHandle | null): Promise<void> {
  if (!handle) return;
  const db = await getIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.put(handle, HANDLE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadFileHandle(): Promise<FileSystemFileHandle | null> {
  const db = await getIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.get(HANDLE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearFileHandle(): Promise<void> {
  const db = await getIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.delete(HANDLE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
