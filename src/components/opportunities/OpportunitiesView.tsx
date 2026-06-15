export default function OpportunitiesView() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground">All your applications in list form. (Full list + forms in PR 4)</p>
        </div>
        <button className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent">
          + New Opportunity (stub)
        </button>
      </div>

      <div className="text-sm text-muted-foreground border rounded p-4">
        List view with filters, company links, priority, comp hints, and "Open detail" will be here.<br />
        Rich detail (tasks, contacts, meetings) in PR 6.
      </div>
    </div>
  )
}
