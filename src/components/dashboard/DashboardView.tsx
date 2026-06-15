import { useAppStore } from '@/lib/store';
import { isOverdue } from '@/lib/utils';

export default function DashboardView() {
  const { data, getCompaniesWithStats, getUpcomingTasks } = useAppStore();

  const companiesWithStats = getCompaniesWithStats();
  const upcoming = getUpcomingTasks(6);

  // Simple stage counts from real data
  const stageCounts = data.opportunities.reduce((acc: Record<string, number>, opp) => {
    acc[opp.stage] = (acc[opp.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Pipeline overview and upcoming actions. (Full visual + polish in PR 7)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {(['Researching', 'Applied', 'Interviewing', 'Offer', 'Closed Won', 'Closed Lost'] as const).map(stage => (
          <div key={stage} className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">{stage}</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">{stageCounts[stage] || 0}</div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="font-medium mb-3 flex items-center gap-2">
          Upcoming next actions <span className="text-xs text-muted-foreground">(from store)</span>
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            No open tasks yet. Add some via opportunity detail (coming in PR6) or load sample data from the top bar.
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(({ task, opp, company }: { task: any; opp: any; company: any }) => {
              const overdue = isOverdue(task);
              return (
                <div key={task.id} className={`rounded border p-3 text-sm flex justify-between ${overdue ? 'bg-red-50 border-red-200 dark:bg-red-950/30' : 'bg-card'}`}>
                  <div>
                    <span className="font-medium">{task.title}</span>
                    <span className="ml-2 text-muted-foreground">— {opp.role_title} @ {company.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {task.due || 'No due'} {overdue && '• OVERDUE'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Companies tracked: {companiesWithStats.length} • Total opportunities: {data.opportunities.length}. Data auto-persists to localStorage (PR2).
      </div>
    </div>
  );
}

