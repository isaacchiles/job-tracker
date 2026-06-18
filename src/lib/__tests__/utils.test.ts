import { describe, it, expect } from 'vitest';
import { isOverdue, getNextActionForOpp, computeDeleteSummary, formatHeadcount, mergeData, applyDeleteCompany } from '../utils';
import type { AppData, Company, Contact, Opportunity, Task } from '../types';

describe('utils', () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

  it('formatHeadcount formats correctly (buckets)', () => {
    expect(formatHeadcount(50)).toBe('11-50');
    expect(formatHeadcount(1500)).toBe('501-2000');
    expect(formatHeadcount(null)).toBe('Unknown');
  });

  it('isOverdue detects past due open tasks', () => {
    const pastTask: Task = { id: 't1', title: 'old', due: yesterday, done: false, created_at: now.toISOString(), updated_at: now.toISOString() };
    const futureTask: Task = { ...pastTask, due: tomorrow };
    const doneTask: Task = { ...pastTask, done: true };

    expect(isOverdue(pastTask)).toBe(true);
    expect(isOverdue(futureTask)).toBe(false);
    expect(isOverdue(doneTask)).toBe(false);
    expect(isOverdue({ ...pastTask, due: null })).toBe(false);
  });

  it('getNextActionForOpp returns earliest open task by due', () => {
    const opp: Opportunity = {
      id: 'o1', company_id: 'c1', via_company_id: null, role_title: 'Test', role_type: 'Full-time',
      stage: 'Researching', job_url: null, location: null, source: null, priority: 'Medium',
      ote: null, equity: null, title_bump: 'Same', work_mode: 'Hybrid', why_interested: null, notes: null,
      applied_at: null, created_at: now.toISOString(), updated_at: now.toISOString(),
      tasks: [
        { id: 't1', title: 'later', due: tomorrow, done: false, created_at: now.toISOString(), updated_at: now.toISOString() },
        { id: 't2', title: 'urgent', due: today, done: false, created_at: now.toISOString(), updated_at: now.toISOString() },
        { id: 't3', title: 'done', due: yesterday, done: true, created_at: now.toISOString(), updated_at: now.toISOString() },
      ],
      meetings: [], contact_ids: []
    };
    const data: AppData = { version: 1, companies: [], opportunities: [opp], meta: {} };

    const next = getNextActionForOpp(opp, data);
    expect(next?.title).toBe('urgent');
  });

  it('computeDeleteSummary calculates primary/via/contacts correctly', () => {
    const company: Company = { id: 'c1', name: 'TestCo', website: null, industry: null, funding_stage: 'Public', headcount: null, ai_native: false, is_contractor: false, hq_location: null, notes: null, created_at: now.toISOString(), updated_at: now.toISOString(), contacts: [{ id: 'ct1', name: 'Contact', title: null, linkedin: null, notes: null, created_at: now.toISOString(), updated_at: now.toISOString() }] };
    const oppPrimary: Opportunity = { id: 'op1', company_id: 'c1', via_company_id: null, role_title: 'Role', role_type: 'Full-time', stage: 'Researching', job_url: null, location: null, source: null, priority: 'Medium', ote: null, equity: null, title_bump: 'Same', work_mode: 'Hybrid', why_interested: null, notes: null, applied_at: null, created_at: now.toISOString(), updated_at: now.toISOString(), tasks: [], meetings: [], contact_ids: ['ct1'] };
    const oppVia: Opportunity = { ...oppPrimary, id: 'op2', company_id: 'c2', via_company_id: 'c1' };

    const data: AppData = { version: 1, companies: [company], opportunities: [oppPrimary, oppVia], meta: {} };

    const summary = computeDeleteSummary(data, 'c1');
    expect(summary.removedPrimaryOpps).toBe(1);
    expect(summary.nulledViaOpps).toBe(1);
    expect(summary.deletedContacts).toBe(1);
    expect(summary.cleanedContactLinks).toBe(0); // contact link was on removed primary, not "cleaned" from remaining opps
  });
});

// --- Builders for merge/delete tests ---
const T0 = '2026-01-01T00:00:00.000Z';
function makeContact(over: Partial<Contact> = {}): Contact {
  return { id: 'ct', name: 'C', title: null, linkedin: null, notes: null, created_at: T0, updated_at: T0, ...over };
}
function makeCompany(over: Partial<Company> = {}): Company {
  return { id: 'c', name: 'Co', website: null, industry: null, funding_stage: 'Public', headcount: null, ai_native: false, is_contractor: false, hq_location: null, notes: null, created_at: T0, updated_at: T0, contacts: [], ...over };
}
function makeOpp(over: Partial<Opportunity> = {}): Opportunity {
  return { id: 'o', company_id: null, via_company_id: null, role_title: 'R', role_type: 'Full-time', stage: 'Researching', job_url: null, location: null, source: null, priority: 'Medium', ote: null, equity: null, title_bump: 'Same', work_mode: 'Hybrid', why_interested: null, notes: null, applied_at: null, created_at: T0, updated_at: T0, tasks: [], meetings: [], contact_ids: [], ...over };
}
function makeData(over: Partial<AppData> = {}): AppData {
  return { version: 1, companies: [], opportunities: [], meta: {}, ...over };
}

describe('mergeData', () => {
  it('adds companies/opps that do not exist in current', () => {
    const { result } = mergeData(
      makeData(),
      makeData({ companies: [makeCompany({ id: 'c1', name: 'New' })], opportunities: [makeOpp({ id: 'o1' })] }),
    );
    expect(result.companies.map(c => c.id)).toEqual(['c1']);
    expect(result.opportunities.map(o => o.id)).toEqual(['o1']);
  });

  it('replaces an existing company only when incoming.updated_at is newer', () => {
    const current = makeData({ companies: [makeCompany({ id: 'c1', name: 'Old', updated_at: '2026-01-01T00:00:00.000Z' })] });
    const newer = mergeData(current, makeData({ companies: [makeCompany({ id: 'c1', name: 'New', updated_at: '2026-06-01T00:00:00.000Z' })] }));
    expect(newer.result.companies.find(c => c.id === 'c1')!.name).toBe('New');

    const older = mergeData(current, makeData({ companies: [makeCompany({ id: 'c1', name: 'Stale', updated_at: '2025-01-01T00:00:00.000Z' })] }));
    expect(older.result.companies.find(c => c.id === 'c1')!.name).toBe('Old');
  });

  it('nulls a dangling via_company_id after merge', () => {
    const { result } = mergeData(makeData(), makeData({ opportunities: [makeOpp({ id: 'o1', via_company_id: 'missing' })] }));
    expect(result.opportunities[0].via_company_id).toBeNull();
  });

  it('cleans dangling contact_ids and warns', () => {
    const { result, warnings } = mergeData(makeData(), makeData({ opportunities: [makeOpp({ id: 'o1', contact_ids: ['ghost'] })] }));
    expect(result.opportunities[0].contact_ids).toEqual([]);
    expect(warnings.some(w => w.toLowerCase().includes('dangling'))).toBe(true);
  });

  it('keeps contact_ids that resolve to a real contact', () => {
    const company = makeCompany({ id: 'c1', contacts: [makeContact({ id: 'ct1' })] });
    const { result } = mergeData(
      makeData(),
      makeData({ companies: [company], opportunities: [makeOpp({ id: 'o1', company_id: 'c1', contact_ids: ['ct1'] })] }),
    );
    expect(result.opportunities[0].contact_ids).toEqual(['ct1']);
  });
});

describe('applyDeleteCompany', () => {
  it('removes the company, removes its primary opps, and nulls via references', () => {
    const data = makeData({
      companies: [makeCompany({ id: 'c1' }), makeCompany({ id: 'c2' })],
      opportunities: [
        makeOpp({ id: 'primary', company_id: 'c1' }),
        makeOpp({ id: 'via', company_id: 'c2', via_company_id: 'c1' }),
      ],
    });
    const { newData } = applyDeleteCompany(data, 'c1');
    expect(newData.companies.map(c => c.id)).toEqual(['c2']);
    expect(newData.opportunities.map(o => o.id)).toEqual(['via']);
    expect(newData.opportunities.find(o => o.id === 'via')!.via_company_id).toBeNull();
  });
});
