import { describe, it, expect } from 'vitest';
import { isOverdue, getNextActionForOpp, computeDeleteSummary, formatHeadcount } from '../utils';
import type { AppData, Company, Opportunity, Task } from '../types';

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
