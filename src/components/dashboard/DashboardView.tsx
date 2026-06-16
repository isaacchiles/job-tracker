import { useAppStore } from '@/lib/store';
import { isOverdue } from '@/lib/utils';
import { STAGES, STAGE_COLORS } from '@/lib/constants';

export default function DashboardView() {
  const { data, getCompaniesWithStats, getUpcomingTasks, toggleTaskDone } = useAppStore();

  const companiesWithStats = getCompaniesWithStats();
  const upcoming = getUpcomingTasks(6);

  // Stage counts from real data (all stages)
  const stageCounts = data.opportunities.reduce((acc: Record<string, number>, opp) => {
    acc[opp.stage] = (acc[opp.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleClickTask = (opp: any) => {
    (window as any).openOpportunityDetail?.(opp);
  };

  const handleToggleTask = (e: React.MouseEvent, oppId: string, taskId: string) => {
    e.stopPropagation();
    toggleTaskDone(oppId, taskId);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Pipeline overview and upcoming next actions (sorted by due date).</p>
      </div>

      {/* Pipeline overview - visual cards with colors */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {STAGES.map(stage => (
          <div 
            key={stage} 
            className={`rounded-xl border p-4 hover:bg-accent/50 transition cursor-default ${STAGE_COLORS[stage]}`}
          >
            <div className="text-sm font-medium">{stage}</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">{stageCounts[stage] || 0}</div>
            <div className="mt-1 h-1.5 bg-current/20 rounded">
              <div 
                className="h-1.5 bg-current rounded transition-all" 
                style={{ width: `${Math.min(100, (stageCounts[stage] || 0) * 10)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming next actions - table style with done checkbox */}
      <div className="mb-8">
        <h2 className="font-medium mb-3 flex items-center gap-2">
          Upcoming next actions <span className="text-xs text-muted-foreground">(sorted by due date • click row to open detail • check to mark done)</span>
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            No open tasks yet. Add some via opportunity detail or load sample data from the top bar.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="w-8 p-2"></th>
                  <th className="text-left p-2 font-medium">Task</th>
                  <th className="text-left p-2 font-medium">Opportunity</th>
                  <th className="text-right p-2 font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {upcoming.map(({ task, opp, company }: { task: any; opp: any; company: any }) => {
                  const overdue = isOverdue(task);
                  return (
                    <tr 
                      key={task.id} 
                      onClick={() => handleClickTask(opp)}
                      className={`cursor-pointer hover:bg-accent/30 ${overdue ? 'bg-red-50 dark:bg-red-950/30' : ''}`}
                    >
                      <td className="p-2" onClick={(e) => handleToggleTask(e, opp.id, task.id)}>
                        <input 
                          type="checkbox" 
                          checked={task.done} 
                          onChange={() => {}} 
                          className="h-4 w-4 accent-primary" 
                        />
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{task.title}</span>
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {opp.role_title} @ {company.name}
                      </td>
                      <td className="p-2 text-right text-xs text-muted-foreground tabular-nums">
                        {task.due || 'No due'} {overdue && <span className="text-red-600 font-medium">• OVERDUE</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Companies tracked: {companiesWithStats.length} • Total opportunities: {data.opportunities.length}. All data auto-persists locally.
      </div>
    </div>
  );
}

