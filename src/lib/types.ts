// Exact data model from DESIGN.md - all v1 interfaces + enums + Zod-ready

// Enums (exact, fixed for v1)
export type PipelineStage =
  | 'Researching'
  | 'Applied'
  | 'Interviewing'
  | 'Offer'
  | 'Closed Won'
  | 'Closed Lost';

export type RoleType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Other';

export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite';

export type TitleBump = 'Same' | 'Medium' | 'Large';

export type FundingStage = 'Public' | 'Private' | 'Startup';

export type MeetingType = 'Phone' | 'Video' | 'Onsite' | 'Other';

export type Priority = 'High' | 'Medium' | 'Low';

// Core entities
export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  funding_stage: FundingStage;
  headcount: number | null;
  ai_native: boolean;
  is_contractor: boolean;
  hq_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Embedded (owned)
  contacts: Contact[];
}

export interface Contact {
  id: string;
  name: string;
  title: string | null;
  linkedin: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  company_id: string | null;        // Primary target company (can be added later)
  via_company_id: string | null;    // Optional contracting/staffing firm
  role_title: string;
  role_type: RoleType;
  stage: PipelineStage;
  job_url: string | null;
  location: string | null;
  source: string | null;
  priority: Priority;
  ote: number | null;
  equity: string | null;
  title_bump: TitleBump;
  work_mode: WorkMode;
  why_interested: string | null;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
  // Embedded
  tasks: Task[];
  meetings: Meeting[];
  contact_ids: string[];
}

export interface Task {
  id: string;
  title: string;
  due: string | null;
  done: boolean;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  date: string;
  type: MeetingType;
  attendees: string;
  notes: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

// Root state
export interface AppData {
  version: 1;
  companies: Company[];
  opportunities: Opportunity[];
  meta?: {
    last_exported_at?: string;
  };
}

// Helper result types (used by store, defined here for sharing)
export interface DeleteCompanySummary {
  companyId: string;
  removedPrimaryOpps: number;
  nulledViaOpps: number;
  deletedContacts: number;
  cleanedContactLinks: number;
  affectedOppIds: string[];
}

export interface ImportResult {
  mode: 'replace' | 'merge';
  replaced: boolean;
  companiesAdded: number;
  companiesUpdated: number;
  opportunitiesAdded: number;
  opportunitiesUpdated: number;
  contactsAdded: number;
  contactsUpdated: number;
  tasksAdded: number;
  tasksUpdated: number;
  meetingsAdded: number;
  meetingsUpdated: number;
  versionMigrated: boolean;
  warnings: string[];  // e.g. "3 dangling contact links cleaned", "1 company id collision resolved by updated_at", schema notes
}

// Zod schemas for validation (used in persistence import)
import { z } from 'zod';

export const PipelineStageSchema = z.enum(['Researching', 'Applied', 'Interviewing', 'Offer', 'Closed Won', 'Closed Lost']);
export const RoleTypeSchema = z.enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Other']);
export const WorkModeSchema = z.enum(['Remote', 'Hybrid', 'Onsite']);
export const TitleBumpSchema = z.enum(['Same', 'Medium', 'Large']);
export const FundingStageSchema = z.enum(['Public', 'Private', 'Startup']);
export const MeetingTypeSchema = z.enum(['Phone', 'Video', 'Onsite', 'Other']);
export const PrioritySchema = z.enum(['High', 'Medium', 'Low']);

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().nullable(),
  linkedin: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().nullable(),
  industry: z.string().nullable(),
  funding_stage: FundingStageSchema,
  headcount: z.number().nullable(),
  ai_native: z.boolean(),
  is_contractor: z.boolean().default(false),
  hq_location: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  contacts: z.array(ContactSchema),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  due: z.string().nullable(),
  done: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const MeetingSchema = z.object({
  id: z.string(),
  date: z.string(),
  type: MeetingTypeSchema,
  attendees: z.string(),
  notes: z.string().nullable(),
  outcome: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const OpportunitySchema = z.object({
  id: z.string(),
  company_id: z.string().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  via_company_id: z.string().nullable(),
  role_title: z.string(),
  role_type: RoleTypeSchema,
  stage: PipelineStageSchema,
  job_url: z.string().nullable(),
  location: z.string().nullable(),
  source: z.string().nullable(),
  priority: PrioritySchema,
  ote: z.number().nullable(),
  equity: z.string().nullable(),
  title_bump: TitleBumpSchema,
  work_mode: WorkModeSchema,
  why_interested: z.string().nullable(),
  notes: z.string().nullable(),
  applied_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  tasks: z.array(TaskSchema),
  meetings: z.array(MeetingSchema),
  contact_ids: z.array(z.string()),
});

export const AppDataSchema = z.object({
  version: z.literal(1),
  companies: z.array(CompanySchema),
  opportunities: z.array(OpportunitySchema),
  meta: z.object({
    last_exported_at: z.string().optional(),
  }).optional(),
});

// Full store interface (re-exported/used by store.ts)
export interface AppStore {
  data: AppData;

  // Company
  addCompany(input: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'contacts'>): { id: string; warning?: string };
  updateCompany(id: string, patch: Partial<Omit<Company, 'id' | 'contacts' | 'created_at'>>): void;
  deleteCompany(id: string): DeleteCompanySummary;

  // Opportunity
  addOpportunity(input: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'tasks' | 'meetings' | 'contact_ids'>): string;
  updateOpportunity(id: string, patch: Partial<Omit<Opportunity, 'id' | 'tasks' | 'meetings' | 'contact_ids' | 'created_at'>>): void;
  deleteOpportunity(id: string): void;
  moveOppStage(oppId: string, newStage: PipelineStage): void;

  // Tasks
  addTaskToOpp(oppId: string, task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): string;
  updateTask(oppId: string, taskId: string, patch: Partial<Omit<Task, 'id' | 'created_at'>>): void;
  toggleTaskDone(oppId: string, taskId: string): void;
  deleteTask(oppId: string, taskId: string): void;

  // Meetings
  addMeetingToOpp(oppId: string, meeting: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>): string;
  updateMeeting(oppId: string, meetingId: string, patch: Partial<Omit<Meeting, 'id' | 'created_at'>>): void;
  deleteMeeting(oppId: string, meetingId: string): void;

  // Contacts
  addContactToCompany(companyId: string, contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): string;
  updateContact(companyId: string, contactId: string, patch: Partial<Omit<Contact, 'id' | 'created_at'>>): void;
  deleteContact(companyId: string, contactId: string): void;
  linkContactToOpp(oppId: string, contactId: string): void;
  unlinkContactFromOpp(oppId: string, contactId: string): void;

  // Persistence
  exportData(): AppData;
  importData(data: AppData, mode: 'replace' | 'merge'): ImportResult;
  loadFromStorage(): void;

  // Selectors
  getOpportunity(id: string): Opportunity | undefined;
  getCompany(id: string | null): Company | undefined;
  getNextActionForOpp(oppOrId: Opportunity | string): Task | null;
  getOppsForCompany(companyId: string, options?: { includeVia?: boolean }): Opportunity[];
  getAllOpenTasksSorted(): Array<{ task: Task; opp: Opportunity; company: Company | null }>;
  getUpcomingTasks(limit?: number): Array<{ task: Task; opp: Opportunity; company: Company | null }>;
  getCompaniesWithStats(): Array<Company & { primaryOppCount: number; viaOppCount: number; totalOppCount: number; hasAINative?: boolean }>;
}
