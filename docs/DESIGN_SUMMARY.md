# JobTracker Design Summary

**Produced:** 2026-06-15  
**Design Document:** `/tmp/grok-design-doc-fd1440c1.md`  
**Workspace:** Fresh `/Users/isaac/Documents/job-tracker` (only README + .git)

## What Was Produced

A comprehensive, implementation-ready design document (≈ 850 lines) for **JobTracker**, a pure client-side standalone web application for job seekers. The document translates all provided user requirements, clarifications, and prior analysis into concrete artifacts:

- Exact TypeScript interfaces + Zod-compatible enums for every entity (Company, Opportunity with `company_id` + optional `via_company_id`, Contact, Task, Meeting).
- Full data relationships handling (company-centric + contracting flexibility, contacts 1:N on Company but linkable to Opportunity via `contact_ids`, tasks/meetings embedded).
- Detailed screen specifications (Dashboard, Kanban Board with DND, Companies table, Opportunities list, rich Opportunity Detail with sections for tasks/contacts/meetings).
- Three Mermaid diagrams: ERD (data model), high-level UI component hierarchy, main data flow + persistence.
- Complete tech stack recommendation with justifications (Vite + React + TS + Tailwind + shadcn/ui + Zustand + @hello-pangea/dnd + react-hook-form + zod + TanStack Table + date-fns).
- Persistence strategy: localStorage (auto) + JSON export/import (primary) + optional File System Access API for direct local file sync (Chromium).
- Usability details: overdue highlighting, promoted "next action" (top open task), AI-native visual distinction, auto `applied_at`, keyboard support, live auto-save.
- Thorough "Alternatives Considered" section exploring persistence options, DND libraries, state management, embedding vs normalization, delivery model (web vs Tauri), etc.
- **Key Decisions** section (11 items) with brief rationale for each architectural choice.
- Concrete example data shapes and seed guidance.
- Resolved all major modeling questions from the clarifications (tasks list, contracting via, contacts alignment).

The document is specific enough to begin coding directly from the PR plan.

## Key Highlights from the Design

- **Data model** emphasizes flexibility for real-world job search (primary company vs staffing firm, multi-opp per company, company-owned contacts).
- **Tasks replace single "next action"**: small embedded list per opp; next action derived as earliest-due open task.
- **Persistence is local-first and robust**: always localStorage + manual JSON backup/restore; bonus direct file I/O in modern browsers without heavy native deps.
- **Core UX flows** (DND stage changes, quick company→opp, inline tasks/meetings/contacts, dashboard upcoming) are called out with implementation paths.
- **No scope creep**: strictly adheres to non-goals (no AI, no cloud, fixed stages, text-only, etc.).
- Desktop-optimized SPA (sidebar nav, modals/sheets for detail) but responsive.

## PR Plan Overview (8 Incremental, Reviewable PRs)

1. **Scaffolding** — Vite/React/TS/Tailwind/shadcn + types + shell layout + aliases + core deps.
2. **Store + Persistence** — Zustand, full actions, localStorage auto-persist, JSON import/export + validation, seed helpers, utils.
3. **Companies** — Full vertical: table (TanStack), search/AI filter, CRUD modals, quick "Add Opportunity".
4. **Opportunities (basic)** — List + create/edit form + filters, basic CRUD, links to companies.
5. **Kanban Board** — 6-column DND using @hello-pangea/dnd, cards, stage moves (with applied_at side effects), add from columns.
6. **Opportunity Detail** — Rich view (form sections + Tasks list + Contacts linker + Meetings log + add forms). The "full record" deliverable.
7. **Dashboard + Polish** — Pipeline visual + upcoming tasks, global search, FS Access API integration, CSV export, keyboard, responsive, empty states, last-saved.
8. **Finalization** — Tests, docs (README), build verification, accessibility, remove stubs, data roundtrip validation.

Strategy: Early PRs deliver usable slices (Companies usable standalone after PR 3). Persistence is early so every feature gets save/export for free. DND and rich detail come after solid data foundations. Each PR should be runnable and testable in isolation.

## How the Design Addresses All Inputs

- Original vision (Kanban 6 stages, companies + multi-opps, contacts, meetings, dashboard, companies list, opp detail) fully mapped.
- Clarifications: standalone/no-server, tasks list + promoted next action, contacts under Company + linked to opp, contracting via_company_id modeled explicitly, standard fields (UUIDs, timestamps, applied_at, job_url, location, source, priority, hq_location) added.
- Additional notes (fixed stages, role types list, suggested fields, DND, desktop focus, localStorage+export+FS API option, shadcn, zustand, etc.) incorporated as primary recommendations.
- From prior evaluation (README): enums locked in, dates/relationships clarified, UI details (quick add, DND, detail sections) specified.

## Next Steps After This Design

1. Review/approve this document (and resolve the 6 minor open questions listed at the end).
2. Begin execution with **PR 1** (scaffolding) in the `/Users/isaac/Documents/job-tracker` workspace.
3. Subsequent PRs follow the ordered plan; each can be reviewed with `npm run dev`.

The design prioritizes a realistic, incremental path to a delightful, daily-driver job search tool while staying tightly scoped to MVP.

**Full details, diagrams, exact field lists, and PR descriptions are in the primary design document.**
