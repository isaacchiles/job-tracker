
import { Droppable } from '@hello-pangea/dnd';
import OpportunityCard from './OpportunityCard';
import { Button } from '../ui/Button';
import type { PipelineStage } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/constants';

interface Props {
  stage: PipelineStage;
  opps: any[];
}

export default function StageColumn({ stage, opps }: Props) {

  const handleAdd = () => {
    (window as any).openOpportunityForm?.({ prefill: { stage } }); // prefill stage if supported, else just open
    // For now, since form has stage select, just open new
    (window as any).openOpportunityForm?.();
    // To prefill stage, we could enhance form later; for PR5 this is fine. User can set.
  };

  return (
    <div className="rounded-xl border bg-card p-3 min-h-[320px] flex flex-col">
      <div className="font-medium text-sm mb-3 flex items-center justify-between">
        <span className={STAGE_COLORS[stage] ? `px-2 py-0.5 rounded ${STAGE_COLORS[stage]}` : ''}>{stage}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-muted">{opps.length}</span>
      </div>

      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[200px] rounded ${snapshot.isDraggingOver ? 'bg-muted/30' : ''}`}
          >
            {opps.map((opp, index) => (
              <OpportunityCard key={opp.id} opp={opp} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <Button 
        variant="ghost" 
        size="sm" 
        className="mt-2 w-full text-xs" 
        onClick={handleAdd}
      >
        + Add to {stage}
      </Button>
    </div>
  );
}
