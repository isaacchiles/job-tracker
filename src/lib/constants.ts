import type { PipelineStage, RoleType, WorkMode, TitleBump, FundingStage, MeetingType, Priority } from './types';

export const STAGES: PipelineStage[] = [
  'Researching',
  'Applied',
  'Interviewing',
  'Offer',
  'Closed Won',
  'Closed Lost',
];

export const STAGE_COLORS: Record<PipelineStage, string> = {
  Researching: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Applied: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Interviewing: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  Offer: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Closed Won': 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300',
  'Closed Lost': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const ROLE_TYPES: RoleType[] = ['Full-time', 'Contract', 'Internship', 'Other'];

export const WORK_MODES: WorkMode[] = ['Remote', 'Hybrid', 'Onsite'];

export const TITLE_BUMPS: TitleBump[] = ['Same', 'Medium', 'Large'];

export const FUNDING_STAGES: FundingStage[] = [
  'Unknown',
  'Bootstrapped',
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C',
  'Series D+',
  'Growth',
  'Public',
];

export const MEETING_TYPES: MeetingType[] = ['Phone', 'Video', 'Onsite', 'Other'];

export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export const HEADCOUNT_BUCKETS = [
  { label: '1-10', max: 10 },
  { label: '11-50', max: 50 },
  { label: '51-200', max: 200 },
  { label: '201-500', max: 500 },
  { label: '501-2000', max: 2000 },
  { label: '2000+', max: Infinity },
];

export const APP_VERSION = 1;
