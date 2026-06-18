# JobTracker

A personal, local-first app for job seekers to track **companies, opportunities, contacts, and meetings** in one structured place — a lightweight CRM for your job search.

**▶ Use it now: https://isaacchiles.github.io/job-tracker/**

No install, no account, no server. Your data stays in your browser. Current version is shown in the bottom-left of the sidebar (e.g. `v0.3.0 · <build>`).

---

## For everyone: getting started

JobTracker runs entirely in your browser. Just open the link above and start — there's nothing to sign up for.

A quick first walkthrough:

1. **See it with example data.** In the top bar, click **Load sample data** to populate the app so you can explore. (It backs up anything you already have first.) You can clear it later by importing your own file or starting fresh.
2. **Add a company.** Go to **Companies → + Add Company**. Fill in the name (everything else is optional), and flag it as AI-native or a contracting/staffing firm if relevant.
3. **Add an opportunity.** Press **n** anywhere (or **Opportunities → + New Opportunity**), give it a role title, and link it to a company. One company can have many opportunities.
4. **Work the pipeline.** On the **Kanban** board, drag a card between stages (Researching → Applied → Interviewing → Offer → Closed Won/Lost). Moving a card to Applied or later auto-stamps the applied date.
5. **Track the details.** Click any opportunity to open its detail view, where you can add **tasks** (with due dates), link **contacts**, and log **meetings** with notes and outcomes.
6. **Stay on top of things.** The **Dashboard** shows your pipeline at a glance plus upcoming tasks sorted by due date, with overdue items highlighted and checkboxes to mark them done.
7. **Back up regularly** (see below).

**Browser tip:** Chrome or Microsoft Edge give the best experience — they support the "Save to file"/"Open file" options. The app works in Safari and Firefox too, but those file features may be unavailable.

---

## Your data & backups

Everything is saved automatically to your browser's local storage (`localStorage`, key `jobtracker:data`). That means it persists across reloads and app updates, but it lives only in **this** browser on **this** device.

Because there's no cloud backup, **export regularly** — it takes a second and protects you against cleared browser data, a different device, or browser quirks:

- **Export JSON** — a complete backup file (`jobtracker-backup-*.json`). Keep it in Dropbox/Drive/email.
- **Export CSV** — companies + opportunities as a spreadsheet-friendly table (properly escaped).
- **Save to file / Open file** *(Chrome/Edge)* — read and write a real `.json` file on your computer.
- **Import (wizard)** — validates the file, previews what's inside, and lets you **replace** or **merge**. It always exports a safety backup of your current data first.
- **Crash recovery** — if the app ever hits an unexpected error, it shows a recovery screen with an **Export my data** button that reads your saved data directly, so you can always get a backup out.

Rule of thumb: treat the browser storage as a convenient cache, and your exported JSON as the real backup.

---

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `n` | New opportunity (from anywhere) |
| `/` | Focus the search box on the current page |
| `k` | Jump to the Kanban board |
| `Esc` | Close the open modal/dialog |

---

## Features

- **Companies** — CRUD, AI-native and contractor/staffing flags, search, and per-company opportunity counts.
- **Opportunities** — full record (role, type, stage, priority, OTE, equity, title bump, work mode, source, links, notes), an optional **via** (contracting/staffing) company, and a rich detail view.
- **Kanban** — drag-and-drop across six stages with automatic applied-date stamping.
- **Tasks / Contacts / Meetings** — per-opportunity, with derived "next action" (earliest-due open task) and overdue highlighting.
- **Dashboard** — pipeline overview and an upcoming-tasks table sorted by due date.
- **Data tools** — JSON/CSV export, import wizard (backup + preview + replace/merge), and direct file save/open.
- **Quality-of-life** — dark mode, toasts, keyboard shortcuts, duplicate-company warnings, and a top-level error boundary with data recovery.

---

## For developers

### Run from source

```bash
npm install     # first time / after pulling new deps
npm run dev      # start the dev server at http://localhost:5173
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run build:html` | Build a self-contained single-file app → `JobTracker.html` |
| `npm test` | Run the Vitest unit/component test suite |
| `npm run lint` | ESLint |
| `npm run preview` | Preview a production build locally |

### Tech stack

Vite + React 19 + TypeScript + Tailwind v4, with Zustand (state), React Hook Form + Zod (forms/validation), TanStack Table (tables), `@hello-pangea/dnd` (Kanban), Sonner (toasts), and date-fns. Tests use Vitest + Testing Library (jsdom).

### Project structure

```
src/
  components/      UI by feature (companies, opportunities, kanban, dashboard, layout, ui)
  hooks/           keyboard shortcuts
  lib/
    store.ts       Zustand store (all actions + selectors)
    persistence.ts localStorage, JSON import/export, file-handle (IndexedDB)
    utils.ts       pure domain logic (merge, delete, next-action, dates)
    types.ts       data model + Zod schemas
    __tests__/     unit tests
docs/              design docs + the published single-file site (index.html)
```

### Single-file build

`npm run build:html` inlines the entire app (React, CSS, logic) into one ~600 KB `JobTracker.html` that runs from `file://` — handy for offline use or sharing. It uses hash routing and a relative base so it works both locally and from a subpath. The PWA service worker is intentionally disabled in this build.

### Testing & quality

The suite (`npm test`) covers the domain logic (`mergeData`, `applyDeleteCompany`, next-action sorting, import stats) and components (Modal behavior/a11y, the error boundary). Type-check with `npm run build`.

---

## Deployment (GitHub Pages)

The live site is the single-file build committed to **`docs/index.html`**, served by GitHub Pages from the `main` branch's `/docs` folder (**Settings → Pages → Deploy from a branch → `main` → `/docs`**). The URL is the repo root: `https://isaacchiles.github.io/job-tracker/`.

To publish an update: rebuild the single file and copy it into `docs/`, then commit and push:

```bash
npm run build:html
cp dist/index.html docs/index.html
```

The sidebar footer shows the app version (from `package.json`) plus the short git SHA the build was made from (injected at build time), so you can always confirm which build is live.

---

## Design docs

The full specification, data model, and architecture decisions live in:

- [docs/DESIGN.md](docs/DESIGN.md) — authoritative spec
- [docs/DESIGN_SUMMARY.md](docs/DESIGN_SUMMARY.md) — summary
- [docs/REVIEW.md](docs/REVIEW.md) — design review record

---

## Data model (at a glance)

- **Company** — name, website, industry, funding stage, headcount, AI-native, contractor flag, HQ location, notes, and embedded **contacts** (name, title, LinkedIn, notes).
- **Opportunity** — belongs to a company (and an optional *via* company); role title/type, pipeline stage, work mode, priority, OTE, equity, title bump, source, job URL, location, why-interested, notes, applied date; embedded **tasks** (title, due, done) and **meetings** (date, type, attendees, notes, outcome); linked contact IDs.

All records carry `id`, `created_at`, and `updated_at`.
