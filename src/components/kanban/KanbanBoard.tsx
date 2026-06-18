import React from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useAppStore } from '@/lib/store';
import { STAGES } from '@/lib/constants';
import StageColumn from './StageColumn';
import type { PipelineStage } from '@/lib/types';

export default function KanbanBoard() {
  const { data, moveOppStage } = useAppStore();
  const [search, setSearch] = React.useState('');

  // Group opps by stage (recompute only when opportunities change)
  const oppsByStage: Record<PipelineStage, any[]> = React.useMemo(
    () => STAGES.reduce((acc, stage) => {
      acc[stage] = data.opportunities.filter(opp => opp.stage === stage);
      return acc;
    }, {} as Record<PipelineStage, any[]>),
    [data.opportunities],
  );

  // Apply the search filter (recompute when grouping, search, or companies change)
  const filteredOppsByStage = React.useMemo(() => {
    const q = search.toLowerCase();
    return STAGES.reduce((acc, stage) => {
      acc[stage] = oppsByStage[stage].filter(opp =>
        opp.role_title.toLowerCase().includes(q) ||
        (data.companies.find(c => c.id === opp.company_id)?.name.toLowerCase().includes(q))
      );
      return acc;
    }, {} as Record<PipelineStage, any[]>);
  }, [oppsByStage, search, data.companies]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStage = destination.droppableId as PipelineStage;

    // Call store - it handles applied_at side effect
    moveOppStage(draggableId, newStage);
  };

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">Drag cards between stages. Click card to edit. Full DND + live updates.</p>
        </div>
        <input
          type="text"
          placeholder="Filter roles or companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-1 text-sm max-w-[220px]"
        />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((stage) => (
            <StageColumn 
              key={stage} 
              stage={stage} 
              opps={filteredOppsByStage[stage]} 
            />
          ))}
        </div>
      </DragDropContext>

      <div className="mt-4 text-xs text-muted-foreground">
        Drag to change stage (auto-updates applied date when moving to Applied+). Data persists automatically.
      </div>
    </div>
  );
}
