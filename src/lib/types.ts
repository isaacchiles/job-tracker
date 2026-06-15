// Exact data model from DESIGN.md - all v1 interfaces + enums + Zod-ready

// Enums (exact, fixed for v1)
export type PipelineStage =
  | 'Researching'
  | 'Applied'
  | 'Interviewing'
  | 'Offer'
  | 'Closed Won'
  | 'Closed Lost';

export type RoleType = 'Full-time' | 'Contract' | 'Internship' | 'Other';

export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite';

export type TitleBump = 'Same' | 'Medium' | 'Large';

export type FundingStage =
  | 'Unknown'
  | 'Bootstrapped'
  | 'Pre-seed'
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'Series C'
  | 'Series D+'
  | 'Growth'
  | 'Public';

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
  company_id: string;               // Primary target company (required)
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
  tasksAdded: number;
  meetingsAdded: number;
  versionMigrated: boolean;
  warnings: string[];
}
