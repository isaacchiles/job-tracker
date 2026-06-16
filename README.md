# Job Tracker

A personal application for job seekers to track companies, opportunities, contacts, and meetings in a structured way.

**App name:** JobTracker (confirmed)

**Current status:** Core app complete (PR 1-6 implemented). Full Kanban with DND, Companies CRUD/table, Opportunities list+form, rich Opportunity Detail with tasks/contacts/meetings logs, live Dashboard. All local, persists, sample data. Ready for polish/tests. (Render loop freeze on Companies Add/Edit Company fixed via table data stabilization + form mounting consistency.)

**Design document (authoritative spec + PR plan):** [docs/DESIGN.md](docs/DESIGN.md)  
**Design summary:** [docs/DESIGN_SUMMARY.md](docs/DESIGN_SUMMARY.md)  
**Final review record:** [docs/REVIEW.md](docs/REVIEW.md)

## Getting Started (PR 1 complete)

```bash
cd /path/to/job-tracker
npm install          # only needed after fresh clone
npm run dev
```

Open http://localhost:5173

- Sidebar navigation between Dashboard, Kanban, Companies, Opportunities (stubs for now)
- Dark mode toggle (bottom of sidebar)
- Fully local (data in localStorage + export in future PRs)
- Built with Vite + React + Tailwind + TypeScript

Next PR (2) brings the real Zustand store + persistence + full types in action.

## User's Vision (as provided)

### Core Concepts
- Kanban-style pipeline for opportunities across stages: Researching, Applied, Interviewing, Offer, Closed Won, Closed Lost.
- Companies table: Track target companies independently. Multiple opportunities can belong to one company (e.g., different roles, teams, or re-applications).
- Goal: See how each opportunity at a company is progressing.

### Data Model
- **Company**
  - name
  - website
  - industry
  - funding stage
  - headcount
  - AI-native (flag/boolean)
  - notes

- **Opportunity** (belongs to a Company)
  - role title
  - role type
  - pipeline stage (from the Kanban list)
  - OTE/comp target
  - equity
  - title bump (same/medium/large)
  - remote/hybrid (likely: Onsite | Hybrid | Remote)
  - why interested
  - next action + due date

- **Contacts** (per Opportunity)
  - name
  - title
  - LinkedIn
  - relationship notes

- **Meetings** (per Opportunity, unlimited)
  - date
  - attendees
  - type (phone/video/onsite)
  - meeting notes
  - outcome

### Planned Screens
- **Dashboard**: Pipeline overview (likely counts or visual by stage), upcoming next actions sorted by due date.
- **Companies list**: Table or list view, with quick-add, AI-native tag/highlight.
- **Opportunity detail**: Full editable record, scrollable contact list, meeting log (add/view).

---

## Evaluation & Thoughts

**Overall: Strong foundation.** This is a well-thought-out, focused personal CRM for serious job seekers, especially those targeting specific companies (e.g., AI-native ones) and needing deep relationship/meeting tracking. The explicit Company entity + 1:N opportunities is a smart differentiator from flat "job cards only" tools. The rich fields around compensation, title expectations, funding/headcount, and AI-native signal show clear intent for high-signal data over generic trackers.

### Strengths
- **Relational structure is correct and useful**: Normalizing companies prevents duplication and enables company-level views/insights (e.g., "all my opps at Acme Corp").
- **Kanban stages are practical and complete**: Covers the full lifecycle including post-decision (Closed Won/Lost). "Researching" is a nice explicit pre-apply bucket.
- **Depth on the human side**: Contacts + unlimited meetings/notes per opportunity is excellent for relationship-driven searches and interview prep/recall.
- **Targeted fields**: AI-native + funding + headcount + comp/equity/title bump allow filtering and prioritization that generic tools lack. "Why interested" helps with motivation and tailoring.
- **Minimal but powerful MVP scope**: Three core screens + the models cover 80% of daily usage for tracking without over-engineering.

### Ambiguities & Clarification Needs (to resolve before coding)
1. **Enums & controlled vocabularies**:
   - What are the exact allowed values for:
     - `role_type` (Full-time, Contract, Internship, ...)?
     - `remote/hybrid` (exact options: "Remote", "Hybrid", "Onsite"? Or more granular like "Hybrid 3 days"?)
     - `title_bump` (user said "same/medium/large" — confirm labels and meaning: e.g. "lateral", "+1 level", "+2 levels"?)
     - `funding_stage` (Pre-seed, Seed, Series A/B/C, Growth, Public, ...?)
     - `headcount` (ranges like "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+" or exact number?)
     - `meeting_type` ("phone", "video", "onsite" — any others like "coffee chat"?)
   - Should stages be hardcoded or user-customizable later?

2. **Dates & lifecycle**:
   - Should we track `applied_at` (separate from stage move), `created_at`, `updated_at` on Opportunity?
   - Next action due date: is it a single field, or should we support a lightweight task list per opp (with multiple actions + completion)?
   - Closed Won/Lost: capture close date, reason (optional), offer details?

3. **Relationships & modeling**:
   - Contacts strictly per-opportunity, or also have a global "all contacts" view / deduping across companies?
   - Meetings attendees: free-text list, or linked to the opportunity's Contacts (recommended for structure)?
   - Can an Opportunity exist without a Company (e.g. anonymous posting)? Or always require company?
   - Company uniqueness: by name + website? Or allow duplicates with notes?

4. **Opportunity fields** (missing but likely needed for usability):
   - Job posting URL / link?
   - Location (city or "remote" override)?
   - Source (LinkedIn, referral, company career page, recruiter outreach, etc.)?
   - Job description (paste or summary)?
   - Priority / fit score (1-5 stars or "High/Med/Low")?
   - Resume version / materials used (text or attachment reference for v1)?

5. **UI & interaction details**:
   - Kanban: full drag-and-drop to change stage (with optimistic update + persistence)?
   - Quick-add: from Companies list — does it create company + first opportunity in one flow, or separate?
   - Opportunity detail: page, modal, or drawer/split view?
   - How to "add meeting" or "add contact" inline on detail screen?
   - Dashboard: visual pipeline (counts + maybe simple bars or pie)? Clickable to filter Kanban?
   - Search / filters: global search across companies + opps? Per-screen filters (stage, AI-native, due soon, industry)?
   - Sorting and bulk actions (e.g. mark several as Closed Lost)?

6. **Persistence, scope & non-functional**:
   - Single-user local app only (no accounts/sync)? Or plan for future multi-device (e.g. via file sync or cloud)?
   - Data storage: JSON file(s) + localStorage for speed/simplicity in v1, or embedded SQLite from day one?
   - Export: JSON, CSV (for companies/opps/contacts/meetings), or PDF report?
   - Theme: light/dark? Professional/minimal or warm/encouraging?
   - Platform target: Browser-based (Vite dev server + open in Chrome, build static), or packaged desktop (Tauri/Electron for native window, file pickers, notifications)?
   - Performance: assume < few hundred opps/companies for v1.

7. **Nice-to-haves for roadmap (not MVP)**:
   - Activity timeline / audit log (auto + manual entries).
   - Stats & insights (e.g. applications per week, stage conversion %, time-to-offer, company response rate).
   - Reminders / due notifications (desktop notifications or in-app).
   - Attachments (resume PDFs per opp).
   - Import (CSV bulk, or manual paste from LinkedIn).
   - Company research helpers or AI-assisted note summarization (leveraging local LLMs or Grok API?).
   - Calendar integration or embedded meeting calendar view.
   - "Target list" mode for companies with no open opp yet.

### Suggested Refinements to Data Model (additive, backward-compatible)
- Add system fields everywhere: `id` (UUID), `created_at`, `updated_at`.
- Opportunity: `applied_at` (date), `source`, `location`, `job_url`, `priority` (optional), `status_history` (simple array of {stage, date} or just rely on audit for v1).
- Company: `location` (HQ or primary), `founded_year`?, `glassdoor` or other links (optional).
- Make "next_action" a lightweight object: `{ text: string, due_date: string | null, completed: boolean }` or keep flat for v1 and evolve.
- Meetings: `id`, `created_at`. Consider `outcome` as short enum + free notes, or just rich text.
- For contacts in meetings: recommend storing attendee names as array of strings (for flexibility) + optional links to Contact records by id when they match.
- Soft-delete or archive flag on opps/companies (for "I no longer care about X" without losing history).

### Overall Architecture Recommendation (to decide)
**Preferred for v1 (my lean):** Modern single-page web app (React + TypeScript + Vite + Tailwind + excellent component lib like shadcn/ui + Radix + dnd-kit for Kanban). 

Persistence: In-memory + persisted to a single `data.json` file (or localStorage for pure browser, with explicit Export/Import buttons for backup). This is dead simple, no server, version controllable in git if desired, easy to inspect/edit.

Rationale: Fast to build beautiful, responsive UI. Runs in any browser (or `serve` the build). Can later wrap in Tauri for a real desktop .app with Rust SQLite backend if the JSON approach feels limiting.

Alternative if you want "real desktop app" feeling from day 1: Tauri v2 (web frontend + Rust) + rusqlite. Slightly more setup but excellent macOS integration (menu, notifications, native file dialogs).

**State management:** Zustand or Jotai (light). TanStack Table for the companies list. React Hook Form + Zod for validation on forms.

**Key interactions to nail:**
- Smooth Kanban DND that updates stage + persists immediately.
- Excellent forms for Opportunity (rich but not overwhelming — perhaps sections or tabs: Basics, Comp, Interest, Next Action).
- Easy inline add for Contact and Meeting from the detail view.
- Good table for Companies (sortable, filterable by AI-native, search by name/industry, quick "Add Opportunity" button per row).

### Next Steps to Solid Overview
1. Resolve the ambiguities above (I'll use questions for the critical ones).
2. Lock a tech stack + persistence choice.
3. Finalize exact field list + TypeScript interfaces / Zod schemas.
4. Sketch high-level component tree + data flow (no full wireframes needed if we describe clearly).
5. Agree on MVP cut: what is "must ship before using daily" vs "phase 2".

Once we have that, we can scaffold the project (package.json, tsconfig, tailwind, shadcn, etc.), implement models/storage layer first, then UI screens iteratively, with good practices (types everywhere, clean separation).

This spec is already better than 70% of ad-hoc spreadsheets or Notion setups people use. With polish on the interactions and a couple of the missing fields, it will be a genuinely useful daily driver.

## Design Phase Complete

We ran a full design-doc-writer + design-doc-reviewer loop (multiple rounds) until the reviewer reported **0 open issues**. 

- All original requirements + your clarifications (standalone/no server, task lists with derived next-action, company-aligned contacts linkable to opps, contracting/staffing "via_company" flexibility) are addressed with concrete, implementation-ready details.
- Tech stack locked for v1: Pure client-side standalone (Vite + React + TypeScript + Tailwind + shadcn/ui + Zustand + dnd + etc.). localStorage auto + robust JSON export/import (with safety wizard) + optional FS Access for file-backed in Chromium. No server, data is 100% yours.
- Full data model (with exact TS interfaces), UI flows, 3 diagrams, alternatives, and 8-PRs incremental plan.

**Key Decisions (excerpted):**
- Standalone client web SPA (Vite/React) for speed + rich interactive UI, zero infra.
- Fixed 6 stages; drag-and-drop as primary progression mechanic.
- Opportunity: `company_id` (primary/target) + optional `via_company_id` (contractor/staffing) for the contracting scenario.
- Contacts owned by Company (embedded), linked to Opportunity via IDs.
- Per-opportunity Task[] list (small); next action = earliest-due undone task (derived).
- Persistence: always localStorage + full structured JSON backup/restore with pre-import export safety + merge/replace + Zod. FS API for direct file as power-user stretch (deferred live auto for v1).
- Company dups allowed but soft-warn on create/edit (name+website fuzzy); use notes to distinguish.
- Added practical fields (UUIDs, timestamps, applied_at, job_url, location, source, priority, hq_location, Opportunity.notes) as optional where sensible.

See full "Key Decisions" and "Alternatives Considered" in the DESIGN.md.

**PR Plan (high level, 8 incremental slices):**
1. Scaffolding (Vite/React/TS/Tailwind/shadcn + types + basic shell + deps).
2. Data model + Zustand store (full public API surface) + localStorage persist + JSON import/export (safety) + utils/tests (heaviest foundational; runnable via console after).
3. Companies feature (full table + filters + CRUD + quick-add-opp + delete with summary confirm).
4. Basic Opportunities (list/create/edit + company linking).
5. Kanban Board (DND across 6 stages + cards + stage change side effects).
6. Opportunity Detail (rich form + embedded Tasks + Contacts linking + Meetings log).
7. Dashboard + global polish (pipeline viz + upcoming tasks sorted, search, FS API manual, keyboard, empty states, CSV, responsive).
8. Finalization (tests, README update, build checks, a11y, data roundtrips, remove any stubs).

Each PR is meant to be independently testable (`npm run dev`), with early vertical value (e.g. usable Companies after PR3). Persistence front-loaded.

Full details, file lists per PR, deps, strategy notes, and "exactly what to build" in [docs/DESIGN.md](docs/DESIGN.md).

---

## Project Setup (so far)
- Folder: `~/Documents/job-tracker`
- Git initialized.
- Design artifacts in `docs/`.

We have a **solid overview**. Ready to start building?

Reply with "yes, start with PR 1" (or specify adjustments / start at a certain PR / questions on the design) and I'll scaffold the project and implement incrementally. We can use the check-work or review skills as we go for quality.
