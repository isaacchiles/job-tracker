import { STAGES } from '@/lib/constants'

export default function KanbanView() {
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">Drag opportunities between stages. (Full DND + cards in PR 5)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => (
          <div key={stage} className="rounded-xl border bg-card p-3 min-h-[320px]">
            <div className="font-medium text-sm mb-3 flex items-center justify-between">
              {stage}
              <span className="text-xs px-2 py-0.5 rounded bg-muted">0</span>
            </div>
            <div className="text-[11px] text-muted-foreground border border-dashed rounded p-3 text-center">
              Opportunity cards will render here.<br />Drag &amp; drop coming in PR 5.
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
