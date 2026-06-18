# JobTracker — Code Audit

**Date:** 2026-06-18
**Scope:** Full read of `src/`, `vite.config.ts`, `package.json`, and the bundled `JobTracker.html`.
**Stack:** React 19, TypeScript, Zustand (`subscribeWithSelector`), React Router (HashRouter), React Hook Form + Zod, TanStack Table, `@hello-pangea/dnd`, Sonner, Vite (+ optional PWA / single-file).

This report treats your four starting leads as exactly that — leads. Each is confirmed or qualified below, followed by additional issues found, a general assessment, performance notes, and recommendations. Nothing in your source files was modified.

---

## 1. Bugs (highest priority)

### 1.1 Your four reported leads

#### Lead 1 — `hydrateStore()` redundant call in `App.tsx` — CONFIRMED redundant; "race" is real but narrow
The store already initializes from localStorage at module-load time (`store.ts:53` — `const initialData = loadFromStorage() || createEmptyData()`). The `useEffect` in `App.tsx:20-25` then calls `hydrateStore()`, which re-reads localStorage and `set()`s it again.

Honest assessment of the mechanism:
- On a normal single mount, memory and localStorage are identical at that instant, so the re-read is harmless but wasteful.
- `loadFromStorage()` returns `null` on parse/schema failure, and `loadFromStorage` *action* guards with `if (loaded) set(...)`, so a corrupt store will **not** wipe memory via this path. Good.
- The genuine risk window is a **re-mount** (e.g. if you ever add `<StrictMode>`, or a future router change remounts `App`): the second hydrate would overwrite any in-memory edits that were still inside the 400 ms debounce window with whatever is on disk. Combined with the "Load sample data" flow, this is the most plausible route to the "demo data reappears" symptom you saw.

**Recommendation:** Remove the `hydrateStore()` call (and the `hydrateStore` export if unused elsewhere). It is safe to delete — initialization is already handled at module load. Keep the `window.useAppStore`/`createSampleData` debug assignments out of the same effect or behind a `import.meta.env.DEV` guard.

> Note: the bigger sleep/wake exposure is not hydrate itself but the **multiple competing persistence paths** described in 1.2.7 below. Worth reading together.

#### Lead 2 — Double merge in `store.ts importData` — CONFIRMED (plus a hidden correctness bug)
`store.ts:434-462`. For `merge` mode the action calls `doImport(current, incomingData, mode)` (which internally runs `mergeData` to produce both the merged data and the stats), then **throws away** `doImport`'s merged data and runs `mergeData(current, incomingData)` a *second* time to build `finalData`. So merge runs twice on every import.

Two consequences:
1. **Wasted work** (the visible issue you flagged) — `mergeData` walks every company/opportunity/contact twice and stamps fresh `updated_at` timestamps on dangling-cleanup both times.
2. **Hidden correctness bug in `replace` mode** — for `replace`, `finalData` is built from the *raw* `incomingData` (`store.ts:444-449`), **not** from the Zod-validated/normalized object that `doImport` produced. That means Zod defaults and transforms (e.g. `is_contractor` defaulting to `false`, `company_id: '' → null`) are validated and then **discarded**; the un-normalized input is what actually lands in the store. Malformed-but-recoverable files get validated and then stored un-normalized.

**Recommendation:** Have the store consume `doImport`'s already-computed result instead of recomputing. `doImport` should return the normalized `resultData` alongside the `ImportResult` stats; the store should `set({ data: resultData })`. One merge, one validation, correct normalized data in both modes.

#### Lead 3 — Direct mutation in `exportData` (`persistence.ts`) — CONFIRMED
`persistence.ts:59`: `data.meta = { ...(data.meta || {}), last_exported_at: ... }` mutates the object passed in. Because `store.exportData` passes the live `get().data` reference straight into `doExport` (`store.ts:427`), this mutates the current Zustand state object **in place** before the subsequent `set(...)`. This breaks Zustand's immutability contract and can defeat reference-equality checks (you rely on `a === b` equality in the `subscribeWithSelector` at `store.ts:542`).

**Recommendation:** `exportData` in `persistence.ts` should be pure — only build the blob and trigger the download; never touch `data.meta`. Let the store own the `meta` update via `set(...)` (it already does at `store.ts:429`). This also removes the current double-stamping of `last_exported_at` with two slightly different timestamps.

#### Lead 4 — Sonner `visibilitychange` listener removed from wrong target — CONFIRMED, and updating does NOT fix it
The bundled `JobTracker.html` and the **currently installed `sonner@2.0.7`** both contain the same mismatch in `useIsDocumentHidden`:

```js
// node_modules/sonner/dist/index.js:122-123
document.addEventListener('visibilitychange', callback);
return () => window.removeEventListener('visibilitychange', callback);
```

`window` and `document` are different `EventTarget`s, so the cleanup never removes the listener. I checked the installed version specifically: **2.0.7 still ships this bug, so simply bumping Sonner within `^2.0.7` will not resolve it.**

Real-world impact is **low** in this app: `<Toaster>` is mounted once at the root (`main.tsx`) and never unmounts, so in practice it leaks exactly one listener for the page lifetime rather than accumulating. It would only matter if the Toaster were mounted/unmounted repeatedly.

**Recommendation:** Don't block on this. Track the upstream issue and bump when a fixed release lands; verify the fix by grepping the published `dist` for `window.removeEventListener('visibilitychange'`. If you ever need it gone now, patch via `patch-package`. (Confirm the latest published version before upgrading — my version knowledge has a cutoff.)

---

### 1.2 Additional bugs found

#### 1.2.1 Escape never closes modals — CONFIRMED (real UX bug)
`useKeyboardShortcuts.ts:32-36` calls `(window as any).closeOpportunityDetail`, but **that global is never defined** anywhere (`App.tsx` only defines `openOpportunityForm` and `openOpportunityDetail`). Meanwhile `Modal.tsx` has **no `keydown`/Escape handling of its own** — it only closes on backdrop click or the ✕ button. Net result: pressing Escape does nothing for any modal. Add an Escape handler inside `Modal` (and remove the dead `closeOpportunityDetail` wiring).

#### 1.2.2 Company delete leaves dangling contact links on "via" opportunities — CONFIRMED (data integrity)
`utils.ts applyDeleteCompany` (lines 117-128): for each surviving opp it does `if (opp.via_company_id === companyId) return { ...opp, via_company_id: null }` and **returns early**, skipping the contact-link cleanup in the `else` branch. Contacts can be linked to an opp from either its `company_id` *or* its `via_company_id` (see `linkContactToOpp`, `store.ts:386-389`). So an opportunity that is *via* the deleted company **and** linked to that company's contacts keeps stale `contact_ids` pointing at now-deleted contacts. `computeDeleteSummary` also under-counts here. Fix: in the via branch, null the via *and* filter `contact_ids` in the same returned object.

#### 1.2.3 Dashboard hides tasks for opportunities with no company — CONFIRMED
`store.ts getAllOpenTasksSorted` (lines 493-502) does `const company = data.companies.find(...); if (!company) return;` — opportunities whose `company_id` is `null` (explicitly allowed: "can be added later") or whose company was deleted are skipped entirely, so their open tasks **never appear** in "Upcoming next actions." Either resolve the company optionally and still include the task, or make `company` nullable in the returned shape.

#### 1.2.4 Two backup files downloaded on every import/open/sample-load — CONFIRMED
The App handlers call `exportData()` for "safety," and `store.importData` *also* calls `doExport(current)` internally (`store.ts:438`). So `handleLoadSample`, `handleOpenFile`, and the import wizard each trigger **two** automatic downloads. Pick one owner of the safety-export (recommend the store, so it's guaranteed) and remove the others.

#### 1.2.5 Editing an opportunity can silently drop its "via" company — CONFIRMED (edge case)
`OpportunityFormModal.tsx:165`: `viaOptions = companies.filter(c => c.id !== selectedCompanyId && c.is_contractor)`. On edit, the form resets `via_company_id` to the stored value, but if that company is **not** flagged `is_contractor`, it isn't in the `<select>` options, so the control has no matching value and a save can write back `null` / the wrong value. Either always include the currently-selected via company in the options, or relax the contractor filter on edit.

#### 1.2.6 `crypto.randomUUID()` is undefined in non-secure contexts — RISK for the single-file build
`utils.ts:14` uses `crypto.randomUUID()`. This API requires a secure context. The app is explicitly distributed as a standalone `JobTracker.html` ("works for file://" per comments in `persistence.ts`), and `file://` is **not** a secure context in several browsers — `crypto.randomUUID` can be `undefined` there, which would throw on every add. Add a fallback (`crypto.getRandomValues`-based UUID, or a small polyfill).

#### 1.2.7 Competing, un-debounced persistence paths (the likely sleep/wake culprit)
There are four persistence mechanisms that can interleave:
1. `schedulePersist` — debounced 400 ms localStorage write inside the store.
2. `App.tsx:34-56` subscription — **un-debounced** fire-and-forget *file* write on **every** `data` change.
3. `App.tsx:96-147` flush — localStorage + file write on `visibilitychange:hidden` and `beforeunload`.
4. `hydrateStore()` re-read on mount (Lead 1).

Because editing in `OpportunityDetail` writes to the store **per keystroke** (`handleFieldChange` → `updateOpportunity`), path (2) issues a `createWritable()`/`write()`/`close()` to the chosen file on **every character typed** — heavy I/O and a real chance of overlapping writes. None of (2) is debounced. This cluster, not `hydrateStore` alone, is the most likely source of intermittent "my data changed unexpectedly after the machine slept / I came back to the tab" reports. Consolidate persistence into one debounced writer (see Recommendations §4.1).

#### 1.2.8 Merge stats are computed incorrectly
`persistence.ts:129-132`. `companiesUpdated` is a nonsense expression (`Math.min(before, after) - (after - added)`) that yields `0` even when companies were updated, and `opportunitiesUpdated`/contacts/tasks/meetings are never computed for merge at all. The accurate "updated" count is known inside `mergeData` (it pushes a warning per update) but isn't surfaced. Display-only impact, but the toast you show the user ("X added") is misleading. Track real counts inside `mergeData` and return them.

#### 1.2.9 CSV export has no escaping / formula-injection protection
`App.tsx handleCSVExport` (170-190) concatenates raw field values. `JSON.stringify` is used for `name`/`notes`, but `website`, `industry`, `hq_location`, `location`, `source`, `equity` are interpolated raw — any value containing a comma, quote, or newline corrupts the row. There's also no guard against CSV/formula injection (a field beginning with `=`, `+`, `-`, or `@` executes in Excel/Sheets). Use a single CSV serializer that quotes/escapes every field and prefixes risky leading characters.

#### 1.2.10 External links open without `rel="noopener noreferrer"`
`ContactsSection.tsx:63` — `<a href={contact.linkedin} target="_blank">` with no `rel`. This exposes `window.opener` (reverse tabnabbing) on older engines and is a lint/security smell. Add `rel="noopener noreferrer"`.

#### 1.2.11 Global search uses `alert()` and a window-global store handle
`App.tsx:374-386` reads `(window as any).useAppStore?.getState()` and pops a native `alert()` for a company match. It works, but it's brittle (depends on the debug global assigned in the hydrate effect) and is poor UX. Wire it to the router/detail view directly.

#### 1.2.12 `findSimilarCompany` is over-eager
`utils.ts:231-242` treats any substring match in **either direction** as "similar" (`cName.includes(lowerName) || lowerName.includes(cName)`). Short names ("AI", "Co", "X") will match many unrelated companies and spam the warning toast. Tighten to exact/normalized name or website equality, or a real similarity threshold.

#### 1.2.13 Dead code
`store.ts:537-543` registers a second store subscription whose body is an empty "belt-and-suspenders" comment — it does nothing but adds a subscriber. Remove it.

---

## 2. General code assessment (structure & best practices)

**Overall:** This is a coherent, well-layered local-first app. The separation of `types.ts` (model + Zod) / `utils.ts` (pure helpers) / `persistence.ts` (I/O) / `store.ts` (state + actions) is sensible, and keeping merge/delete logic as **pure functions** in `utils.ts` (with unit tests) is exactly right. The Zod schema doubling as the import validator is a good choice. The main weaknesses are debug residue, loose typing, and the cross-component "global function" wiring.

What's good:
- Pure, tested domain logic (`mergeData`, `applyDeleteCompany`, `computeDeleteSummary`, `getNextActionForOpp`).
- Defensive load path that never silently deletes corrupt data and attempts best-effort recovery.
- Thoughtful UX around destructive actions (delete preview, safety export before import).
- Single source of truth for enums/constants.

What needs attention:
- **Debug `console.log` left in production code.** `Modal.tsx`, `CompanyFormModal.tsx`, and `CompaniesView.tsx` log on render and in handlers (company names, form data). Noise, minor info leakage, and a small perf cost. Strip them or gate behind a debug flag.
- **Pervasive `any`.** `useForm<any>`, `columnHelper<any>()`, `(row: any)`, `... as any` on resolvers and store inputs. This is where real type safety would have caught 1.2.5 and the merge-stats issues. Type the forms to the entity shapes and drop the `as any` casts.
- **Cross-component coordination via `window` globals** (`openOpportunityForm`, `openOpportunityDetail`, and the never-defined `closeOpportunityDetail`). This bypasses React's data flow, defeats type-checking, and is the root of 1.2.1. Prefer a small dedicated Zustand "UI slice" (or context) for modal state.
- **Modal lacks accessibility basics:** no `role="dialog"`/`aria-modal`, no focus trap, no return-focus, no Escape (1.2.1), no body-scroll lock. TanStack tables use `colSpan={6}` hard-coded for the empty row, which will silently break if a column is added/removed.
- **Forms duplicate their default-value object** twice (once in `useForm` defaults, once in the `useEffect` reset). Easy to drift; derive once.
- **Comments reference PR numbers** ("PR2 foundation", "Rich detail in PR6") that are now stale in shipped UI copy (e.g. the Opportunities subtitle). Minor, but user-visible.
- **No error boundary.** A single render throw (e.g. 1.2.6 on `file://`) takes down the whole app with a blank screen. Add a top-level error boundary that surfaces a recovery/export option.

---

## 3. Performance

The data set is small (local job tracking), so none of these are urgent — but a few are easy wins and one is a genuine smell.

1. **Whole-store subscriptions cause app-wide re-renders.** Most components destructure the entire store: `const { data, ... } = useAppStore()` (DashboardView, KanbanBoard, OpportunityFormModal, OpportunityDetail, TasksSection, ContactsSection, MeetingsSection, OpportunitiesView). With Zustand, calling the hook with **no selector** subscribes the component to *every* state change, so a single keystroke in a detail field re-renders all of them. `CompaniesView` does it correctly with selectors (`useAppStore(s => s.data.companies)`) — make the rest match. This is the highest-leverage perf fix.

2. **Per-keystroke file I/O** (1.2.7): the un-debounced file-write subscription fires a full `createWritable`/`write`/`close` cycle on every character typed in the detail modal. Debounce it (or piggyback on the store's existing debounced persist).

3. **Selectors return fresh arrays/objects each call.** `getCompaniesWithStats`, `getAllOpenTasksSorted`, `getOppsForCompany`, `getNextActionForOpp` all allocate and (in the dashboard/kanban) run on every render. Combined with (1), this is churn. Memoize derived data (`useMemo`) and/or compute it with selector subscriptions.

4. **`OpportunitiesView` doesn't memoize `columns`/`getCoreRowModel`/`getFilteredRowModel`** the way `CompaniesView` does — they're rebuilt every render. Cheap to fix with `useMemo`.

5. **`KanbanBoard` recomputes `oppsByStage` and `filteredOppsByStage`** (two passes over all opps per stage) on every render with no memo. Fine at current scale; wrap in `useMemo` keyed on `data.opportunities` + `search` if lists grow.

6. **`assetsInlineLimit: 10_000_000`** inlines `hero.png` and everything else into the single HTML. Expected for the single-file target, but it makes `JobTracker.html` large; keep an eye on it if assets grow.

---

## 4. Recommendations to make it work better

### 4.1 Unify persistence (addresses Leads 1 & 3 and bug 1.2.7)
Make the store the **single** owner of persistence:
- Keep one debounced localStorage writer (already present) and route the file-handle write through the same debounce, reading `getState().data` at flush time.
- Keep exactly one flush on `visibilitychange:hidden` / `beforeunload` (you already have this) and delete the separate per-change file-write subscription in `App.tsx`.
- Remove `hydrateStore()` from the App effect and the dead subscription in `store.ts`.
- Make `persistence.exportData` pure; let the store stamp `meta.last_exported_at` via `set()`.

### 4.2 Fix import to compute once (Lead 2)
Return the normalized merged data from `doImport` and have the store consume it directly for both `replace` and `merge`. One validation, one merge, normalized data stored in both modes, accurate stats.

### 4.3 Replace `window`-global modal wiring with state
Introduce a tiny UI store/context for `{ oppFormOpen, oppDetailOpen, editingOpp, ... }`. This removes the `window.openOpportunityForm`/`openOpportunityDetail`/`closeOpportunityDetail` globals, restores type safety, and makes Escape-to-close trivial and correct (1.2.1).

### 4.4 Harden the data layer
- UUID fallback for non-secure/`file://` contexts (1.2.6).
- Fix `applyDeleteCompany` to clean contact links on via-opps (1.2.2).
- Include company-less opportunities' tasks in the dashboard (1.2.3).
- One CSV serializer with proper quoting + injection guard (1.2.9).

### 4.5 Tighten quality gates
- Strip/guard all `console.log`s; the `react-hooks` ESLint plugin is already a dep — make `npm run lint` part of the build and resolve the `eslint-disable` in `CompanyFormModal`.
- Replace `any` in forms/tables/store inputs with the real entity types.
- Add tests for `mergeData` (both modes), `applyDeleteCompany` (the via + contact-link case in 1.2.2), and `store.importData` — these are the spots where the current bugs live and where there's currently no coverage.
- Add a top-level error boundary with an "export my data" escape hatch.

### 4.6 Accessibility & polish
Give `Modal` `role="dialog"`/`aria-modal`, Escape-to-close, focus trap + return focus, and body-scroll lock; add `rel="noopener noreferrer"` to external links; derive table empty-row `colSpan` from column count; refresh the stale "PR#" copy.

---

## Priority order (suggested)

1. Unify persistence + remove `hydrateStore` (Leads 1 & 3, bug 1.2.7) — the data-integrity / sleep-wake cluster.
2. Fix `importData` double-merge + replace-mode normalization (Lead 2).
3. Company-delete dangling links (1.2.2) and dashboard task omission (1.2.3) — data correctness.
4. Escape-to-close + modal a11y (1.2.1), per-keystroke file writes (perf #2).
5. Whole-store-subscription perf (#1), double-backup downloads (1.2.4), via-company drop on edit (1.2.5).
6. CSV escaping (1.2.9), UUID fallback (1.2.6), console.log cleanup, `any` reduction, tests.
7. Sonner leak (Lead 4) — low impact; track upstream.
