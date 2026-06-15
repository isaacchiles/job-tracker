export default function DashboardView() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Pipeline overview and upcoming actions. (Full implementation in PR 7)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {['Researching', 'Applied', 'Interviewing'].map((stage, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">{stage}</div>
            <div className="mt-2 text-4xl font-semibold tabular-nums">{3 + i}</div>
            <div className="text-xs text-muted-foreground mt-1">opportunities</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-medium mb-3">Upcoming next actions</h2>
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Next action list + due dates will appear here once the store (PR2) and tasks (PR6) are wired.
          <br />
          Example: "Follow up with Sarah at Acme • Due tomorrow • High priority"
        </div>
      </div>

      <div className="mt-8 text-xs text-muted-foreground">
        Tip: Use the sidebar to explore the other views. Everything is local and will persist in later PRs.
      </div>
    </div>
  )
}
