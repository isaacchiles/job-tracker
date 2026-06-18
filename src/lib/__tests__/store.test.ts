import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store';
import type { AppData, Opportunity, Task } from '../types';

const T0 = '2026-01-01T00:00:00.000Z';

function makeTask(over: Partial<Task> = {}): Task {
  return { id: 't', title: 'Task', due: null, done: false, created_at: T0, updated_at: T0, ...over };
}
function makeOpp(over: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'o', company_id: null, via_company_id: null, role_title: 'R', role_type: 'Full-time',
    stage: 'Researching', job_url: null, location: null, source: null, priority: 'Medium',
    ote: null, equity: null, title_bump: 'Same', work_mode: 'Hybrid', why_interested: null,
    notes: null, applied_at: null, created_at: T0, updated_at: T0, tasks: [], meetings: [], contact_ids: [],
    ...over,
  };
}
function setData(over: Partial<AppData> = {}) {
  useAppStore.setState({ data: { version: 1, companies: [], opportunities: [], meta: {}, ...over } });
}

describe('store.getAllOpenTasksSorted', () => {
  beforeEach(() => setData());

  it('includes open tasks for opportunities that have no company (company: null)', () => {
    setData({
      opportunities: [makeOpp({ id: 'o1', company_id: null, tasks: [makeTask({ id: 't1', title: 'Orphan task' })] })],
    });
    const rows = useAppStore.getState().getAllOpenTasksSorted();
    const row = rows.find(r => r.task.id === 't1');
    expect(row).toBeTruthy();
    expect(row!.company).toBeNull();
  });

  it('excludes completed tasks but keeps company-less open ones', () => {
    setData({
      opportunities: [makeOpp({
        id: 'o1', company_id: null,
        tasks: [makeTask({ id: 'done', done: true }), makeTask({ id: 'open', done: false })],
      })],
    });
    const ids = useAppStore.getState().getAllOpenTasksSorted().map(r => r.task.id);
    expect(ids).toContain('open');
    expect(ids).not.toContain('done');
  });
});
