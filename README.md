# Job Tracker

A personal application for job seekers to track companies, opportunities, contacts, and meetings in a structured way.

**App name:** JobTracker (confirmed)

**Current status:** All phases complete (PR 1-8). Full features: Kanban DND, Companies (CRUD + contractor flag + search), Opportunities + rich Detail (tasks/contacts/meetings), Dashboard (pipeline + upcoming table w/ toggles), global search, keyboard shortcuts (n / k / esc), CSV/JSON/FS manual export+import wizard (auto-backup + preview + replace/merge), last-saved indicator, overdue highlights, FS API (manual open/save in Chrome/Edge + fallback), polished UI/toasts/empty states. Local only (LS primary + manual file/JSON). (Prior freezes/fixes + Part-time role + relaxed website + is_contractor included.)

**Design document (authoritative spec + PR plan):** [docs/DESIGN.md](docs/DESIGN.md)  
**Design summary:** [docs/DESIGN_SUMMARY.md](docs/DESIGN_SUMMARY.md)  
**Final review record:** [docs/REVIEW.md](docs/REVIEW.md)

## Getting Started

```bash
cd /path/to/job-tracker
npm install          # only needed after fresh clone
npm run dev
```

Open http://localhost:5173 (or build with `npm run build` and serve `dist/`)

- Sidebar navigation between Dashboard (pipeline + upcoming tasks w/ done toggles), Kanban (DND), Companies (table + form + contractor flag + type), Opportunities (list + full detail w/ tasks/contacts/meetings)
- Dark mode toggle (bottom of sidebar)
- Global search (header + / key), keyboard shortcuts (n=new opp, /=search, k=kanban, esc=close)
- Data: auto LS + Export JSON/CSV, Import wizard (backup+preview+replace/merge), manual FS "Save/Open file" (Chrome/Edge)
- Last saved time, overdue highlights, sample data, toasts, responsive
- Fully local (primary localStorage; manual JSON/CSV/file for backup/restore)
- Built with Vite + React 19 + Tailwind v4 + TypeScript + zustand + RHF/Zod + tanstack table + pangea dnd
- Installable as PWA (see below)

All PRs (1-8) complete per DESIGN.md.

## Installation & Running as an App

- **Dev mode** (recommended for updates): `npm run dev`
- **Production build**: `npm run build`, then serve the `dist/` folder (e.g. `npx serve dist` or any static server). Works offline-ish.
- **Install as app (PWA)**: 
  - Run the app in Chrome/Edge/Safari (localhost or https).
  - Browser will offer "Install JobTracker" or "Add to Home Screen" in the address bar or menu.
  - Once installed, it runs like a native app (standalone window, offline capable via service worker).
  - Updates: the PWA auto-checks for new versions when you run a fresh build/serve; it will update in background and prompt to reload.

### Packaging as a Self-Contained Single HTML Document

To turn the entire app into **one standalone HTML file** (no Node.js, no server, no extra files - just open the .html in your browser):

```bash
npm run build:html
```

This produces:
- `dist/index.html` (inlined)
- `JobTracker.html` (copy at project root for easy access)

Simply open `JobTracker.html` (or `dist/index.html`) by double-clicking the file or using a `file://` URL in your browser.

- Everything (React app, styles, logic) is inlined into a single ~600KB file.
- Full functionality works using browser localStorage for persistence.
- Great for easy sharing, emailing, or offline use as a "doc".
- Note: Some features like the File System Access API ("Save/Open file") work best when served over http (use `npx serve dist` or similar) rather than pure `file://`. PWA install may not apply to the single file.

This is the easiest "HTML doc" distribution format.

## Offering Updates & How Users Get Them

Since this is a client-side local web app (no backend server):

- **For developers / you (Isaac)**: Keep the repo in git. To offer updates:
  1. Pull latest changes: `git pull`
  2. Install any new deps: `npm install`
  3. Rebuild if needed: `npm run build` (or `npm run build:html` for the single HTML)
  4. Users re-run `npm run dev`, re-serve `dist/`, or open the new single `dist/index.html`.
  - Share via git (clone), zip of the folder, or host the built `dist/` (or just the single index.html) on a simple static site (Netlify, GitHub Pages, Vercel free tier) for easy access.
  - PWA makes "updates" feel seamless (auto SW update) when serving the multi-file build.

### Publishing to a Git Repo on Your GitHub Account

To post this as a public (or private) Git repo attached solely to your account (e.g. under https://github.com/isaac):

1. On GitHub (while logged into your account):
   - Go to https://github.com/new
   - Name: `job-tracker` (or `jobtracker-app`, whatever you prefer)
   - Description: "Personal job seeker tracker - companies, opportunities, contacts, meetings. Local-first, runs as single HTML or web app."
   - Public (for sharing) or Private
   - **Do NOT** check "Add a README file" or initialize with anything (we'll push existing local repo)
   - Create repository.

2. Back in your terminal (in the job-tracker folder):
   ```bash
   # Add the remote (replace 'isaac' with your exact GitHub username, and repo name if different)
   git remote add origin https://github.com/isaac/job-tracker.git

   # Push (assuming branch is 'main')
   git branch -M main
   git push -u origin main
   ```

3. Done! Your full history, code, and the single HTML packaging is now on your GitHub.

- You can later enable GitHub Pages (in repo Settings > Pages) to host the single `dist/index.html` or full dist/ for easy web access (choose "Deploy from a branch" or use Actions for single-file hosting).
- For the single HTML specifically: After push, you (or others) can download the raw `dist/index.html` from the repo or use raw.githubusercontent.com links.
- To keep it "your only repo": This becomes the canonical source. Future updates via PRs or direct pushes from your account.

If you want the repo name or visibility different, or need help with GitHub Pages setup for the HTML doc, just say!

- **For end users**: 
  - If running from source: git pull + npm install + restart.
  - If using installed PWA from a hosted build: refresh or it auto-updates.
  - Data is always in browser localStorage (or chosen file via FS API). Export often for backup.
  - No "app store" install; it's bring-your-own (browser-based).

- Future options (not implemented yet): Tauri/Electron desktop wrapper for true native install + auto-updater (see DESIGN.md alternatives). Or self-hosted version with one-click scripts.

See docs/DESIGN.md for architecture notes on persistence and distribution.

## Keyboard Shortcuts
- `n` — New opportunity form (from anywhere)
- `/` — Focus search input on current page
- `k` — Quick hint to Kanban
- `Esc` — Close open details/modals (where supported)

## Data & Persistence
- Everything auto-saves to localStorage.
- **Export JSON** / **Export CSV** — full or tabular backups.
- **Import (wizard)** — always auto-exports current first, validates, preview counts, choose replace or merge.
- **Save to file** / **Open file** — manual FS API (Chrome/Edge). Use for "real file on disk" workflow. Fallback to JSON export/import.
- Last-saved time shown in header bar.
- Load sample data (with safety export).

See docs/DESIGN.md for full merge/delete semantics and safety guarantees.

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
