import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  AppData,
  AppStore,
  Company,
  Opportunity,
  Task,
  Meeting,
  Contact,
} from './types';
import {
  generateId,
  getNextActionForOpp,
  getOppsForCompany,
  findSimilarCompany,
  applyDeleteCompany,
} from './utils';
import {
  loadFromStorage,
  saveToStorage,
  exportData as doExport,
  importData as doImport,
  createEmptyData,
} from './persistence';

// Debounce helper
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

const DEBOUNCE_MS = 400;

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => {
    // Internal persist scheduler
    const schedulePersist = debounce(() => {
      const { data } = get();
      saveToStorage(data);
    }, DEBOUNCE_MS);

    const persistNow = () => {
      const { data } = get();
      saveToStorage(data);
    };

    // Initial load
    const initialData: AppData = loadFromStorage() || createEmptyData();

    return {
      data: initialData,

      // === Company ===
      addCompany(input) {
        const id = generateId();
        const now = new Date().toISOString();

        const newCompany: Company = {
          ...input,
          id,
          created_at: now,
          updated_at: now,
          contacts: [],
        };

        const current = get().data;
        const similar = findSimilarCompany(current, input.name, input.website);
        const warning = similar
          ? `Similar company "${similar.name}" already exists (created ${new Date(similar.created_at).toLocaleDateString()}). Consider editing the existing one or use notes to distinguish.`
          : undefined;

        const newData: AppData = {
          ...current,
          companies: [...current.companies, newCompany],
        };

        set({ data: newData });
        schedulePersist();

        return { id, warning };
      },

      updateCompany(id, patch) {
        const current = get().data;
        const now = new Date().toISOString();

        const newCompanies = current.companies.map(c =>
          c.id === id ? { ...c, ...patch, updated_at: now } : c
        );

        const newData: AppData = { ...current, companies: newCompanies };
        set({ data: newData });
        schedulePersist();
      },

      deleteCompany(id) {
        const current = get().data;
        const { newData, summary } = applyDeleteCompany(current, id);

        set({ data: newData });
        persistNow(); // immediate for destructive

        return summary;
      },

      // === Opportunity ===
      addOpportunity(input) {
        const id = generateId();
        const now = new Date().toISOString();

        const newOpp: Opportunity = {
          ...input,
          id,
          created_at: now,
          updated_at: now,
          tasks: [],
          meetings: [],
          contact_ids: [],
        };

        const current = get().data;
        const newData: AppData = {
          ...current,
          opportunities: [...current.opportunities, newOpp],
        };

        set({ data: newData });
        schedulePersist();
        return id;
      },

      updateOpportunity(id, patch) {
        const current = get().data;
        const now = new Date().toISOString();

        const newOpps = current.opportunities.map(o =>
          o.id === id ? { ...o, ...patch, updated_at: now } : o
        );

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
      },

      deleteOpportunity(id) {
        const current = get().data;
        const newOpps = current.opportunities.filter(o => o.id !== id);
        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
      },

      moveOppStage(oppId, newStage) {
        const current = get().data;
        const now = new Date().toISOString();

        const newOpps = current.opportunities.map(opp => {
          if (opp.id !== oppId) return opp;

          const updates: Partial<Opportunity> = {
            stage: newStage,
            updated_at: now,
          };

          // Auto-set applied_at when moving into Applied or later for the first time
          if (
            (newStage === 'Applied' || newStage === 'Interviewing' || newStage === 'Offer' || newStage === 'Closed Won') &&
            !opp.applied_at
          ) {
            updates.applied_at = now;
          }

          return { ...opp, ...updates };
        });

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
      },

      // === Tasks ===
      addTaskToOpp(oppId, taskInput) {
        const id = generateId();
        const now = new Date().toISOString();

        const newTask: Task = {
          ...taskInput,
          id,
          created_at: now,
          updated_at: now,
        };

        const current = get().data;
        const newOpps = current.opportunities.map(opp =>
          opp.id === oppId
            ? {
                ...opp,
                tasks: [...opp.tasks, newTask],
                updated_at: now,
              }
            : opp
        );

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
        return id;
      },

      updateTask(oppId, taskId, patch) {
        const now = new Date().toISOString();
        const current = get().data;

        const newOpps = current.opportunities.map(opp => {
          if (opp.id !== oppId) return opp;
          const newTasks = opp.tasks.map(t =>
            t.id === taskId ? { ...t, ...patch, updated_at: now } : t
          );
          return { ...opp, tasks: newTasks, updated_at: now };
        });

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
      },

      toggleTaskDone(oppId, taskId) {
        const now = new Date().toISOString();
        const current = get().data;

        const newOpps = current.opportunities.map(opp => {
          if (opp.id !== oppId) return opp;
          const newTasks = opp.tasks.map(t =>
            t.id === taskId ? { ...t, done: !t.done, updated_at: now } : t
          );
          return { ...opp, tasks: newTasks, updated_at: now };
        });

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
      },

      deleteTask(oppId, taskId) {
        const now = new Date().toISOString();
        const current = get().data;

        const newOpps = current.opportunities.map(opp => {
          if (opp.id !== oppId) return opp;
          const newTasks = opp.tasks.filter(t => t.id !== taskId);
          return { ...opp, tasks: newTasks, updated_at: now };
        });

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
      },

      // === Meetings ===
      addMeetingToOpp(oppId, meetingInput) {
        const id = generateId();
        const now = new Date().toISOString();

        const newMeeting: Meeting = {
          ...meetingInput,
          id,
          created_at: now,
          updated_at: now,
        };

        const current = get().data;
        const newOpps = current.opportunities.map(opp =>
          opp.id === oppId
            ? {
                ...opp,
                meetings: [...opp.meetings, newMeeting],
                updated_at: now,
              }
            : opp
        );

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
        return id;
      },

      updateMeeting(oppId, meetingId, patch) {
        const now = new Date().toISOString();
        const current = get().data;

        const newOpps = current.opportunities.map(opp => {
          if (opp.id !== oppId) return opp;
          const newMeetings = opp.meetings.map(m =>
            m.id === meetingId ? { ...m, ...patch, updated_at: now } : m
          );
          return { ...opp, meetings: newMeetings, updated_at: now };
        });

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
      },

      deleteMeeting(oppId, meetingId) {
        const now = new Date().toISOString();
        const current = get().data;

        const newOpps = current.opportunities.map(opp => {
          if (opp.id !== oppId) return opp;
          const newMeetings = opp.meetings.filter(m => m.id !== meetingId);
          return { ...opp, meetings: newMeetings, updated_at: now };
        });

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
      },

      // === Contacts ===
      addContactToCompany(companyId, contactInput) {
        const id = generateId();
        const now = new Date().toISOString();

        const newContact: Contact = {
          ...contactInput,
          id,
          created_at: now,
          updated_at: now,
        };

        const current = get().data;
        const newCompanies = current.companies.map(c =>
          c.id === companyId
            ? { ...c, contacts: [...c.contacts, newContact], updated_at: now }
            : c
        );

        set({ data: { ...current, companies: newCompanies } });
        schedulePersist();
        return id;
      },

      updateContact(companyId, contactId, patch) {
        const now = new Date().toISOString();
        const current = get().data;

        const newCompanies = current.companies.map(c => {
          if (c.id !== companyId) return c;
          const newContacts = c.contacts.map(ct =>
            ct.id === contactId ? { ...ct, ...patch, updated_at: now } : ct
          );
          return { ...c, contacts: newContacts, updated_at: now };
        });

        set({ data: { ...current, companies: newCompanies } });
        schedulePersist();
      },

      deleteContact(companyId, contactId) {
        const now = new Date().toISOString();
        const current = get().data;

        const newCompanies = current.companies.map(c => {
          if (c.id !== companyId) return c;
          const newContacts = c.contacts.filter(ct => ct.id !== contactId);
          return { ...c, contacts: newContacts, updated_at: now };
        });

        // Also clean from all opps' contact_ids
        const newOpps = current.opportunities.map(opp => {
          if (!opp.contact_ids.includes(contactId)) return opp;
          return {
            ...opp,
            contact_ids: opp.contact_ids.filter(id => id !== contactId),
            updated_at: now,
          };
        });

        set({ data: { ...current, companies: newCompanies, opportunities: newOpps } });
        schedulePersist();
      },

      linkContactToOpp(oppId, contactId) {
        const current = get().data;
        const now = new Date().toISOString();

        const opp = current.opportunities.find(o => o.id === oppId);
        if (!opp) return;

        const company = current.companies.find(
          c => c.id === opp.company_id || c.id === opp.via_company_id
        );
        if (!company) return;

        const contactExists = company.contacts.some(c => c.id === contactId);
        if (!contactExists) return; // invariant

        if (opp.contact_ids.includes(contactId)) return;

        const newOpps = current.opportunities.map(o =>
          o.id === oppId
            ? { ...o, contact_ids: [...o.contact_ids, contactId], updated_at: now }
            : o
        );

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
      },

      unlinkContactFromOpp(oppId, contactId) {
        const current = get().data;
        const now = new Date().toISOString();

        const newOpps = current.opportunities.map(opp =>
          opp.id === oppId
            ? {
                ...opp,
                contact_ids: opp.contact_ids.filter(id => id !== contactId),
                updated_at: now,
              }
            : opp
        );

        set({ data: { ...current, opportunities: newOpps } });
        schedulePersist();
      },

      // === Persistence / bulk ===
      exportData() {
        const { data } = get();
        doExport(data);
        // Also persist the updated meta
        set({ data: { ...data, meta: { ...(data.meta || {}), last_exported_at: new Date().toISOString() } } });
        persistNow();
        return data;
      },

      importData(incomingData, mode) {
        const current = get().data;

        // Safety: always export current first (this is the single owner of the
        // pre-import backup; callers must NOT also export).
        doExport(current);

        // doImport validates, merges/replaces once, and returns both the stats
        // and the resulting data. We consume that data directly — no second merge.
        const { result, data: finalData } = doImport(current, incomingData, mode);

        set({ data: finalData });
        persistNow();

        return result;
      },

      loadFromStorage() {
        const loaded = loadFromStorage();
        if (loaded) {
          set({ data: loaded });
        }
      },

      // === Selectors ===
      getOpportunity(id) {
        return get().data.opportunities.find(o => o.id === id);
      },

      getCompany(id: string | null) {
        if (!id) return undefined;
        return get().data.companies.find(c => c.id === id);
      },

      getNextActionForOpp(oppOrId) {
        return getNextActionForOpp(oppOrId as any, get().data);
      },

      getOppsForCompany(companyId, options) {
        return getOppsForCompany(get().data, companyId, options);
      },

      getAllOpenTasksSorted() {
        const data = get().data;
        const result: Array<{ task: Task; opp: Opportunity; company: Company }> = [];

        data.opportunities.forEach(opp => {
          const company = data.companies.find(c => c.id === opp.company_id);
          if (!company) return;

          opp.tasks
            .filter(t => !t.done)
            .forEach(task => {
              result.push({ task, opp, company });
            });
        });

        // Sort by due (nulls last)
        return result.sort((a, b) => {
          if (!a.task.due && !b.task.due) return 0;
          if (!a.task.due) return 1;
          if (!b.task.due) return -1;
          return a.task.due.localeCompare(b.task.due);
        });
      },

      getUpcomingTasks(limit = 8) {
        const all = get().getAllOpenTasksSorted();
        return all.slice(0, limit);
      },

      getCompaniesWithStats() {
        const data = get().data;
        return data.companies.map(company => {
          const primary = data.opportunities.filter(o => o.company_id === company.id).length;
          const via = data.opportunities.filter(o => o.via_company_id === company.id && o.company_id !== company.id).length;
          return {
            ...company,
            primaryOppCount: primary,
            viaOppCount: via,
            totalOppCount: primary + via,
            hasAINative: company.ai_native,
          };
        });
      },
    };
  })
);

// Convenience: re-read persisted state into the store on demand.
// (Not called on mount — the store already initializes from storage at module load.)
export function hydrateStore() {
  const store = useAppStore.getState();
  store.loadFromStorage();
}
