
import { Draggable } from '@hello-pangea/dnd';
import { useAppStore } from '@/lib/store';
import { STAGE_COLORS } from '@/lib/constants';
import type { Opportunity } from '@/lib/types';

interface Props {
  opp: Opportunity;
  index: number;
}

export default function OpportunityCard({ opp, index }: Props) {
  const { getCompany, getNextActionForOpp } = useAppStore();
  const company = getCompany(opp.company_id);
  const viaCompany = opp.via_company_id ? getCompany(opp.via_company_id) : null;
  const nextAction = getNextActionForOpp(opp);

  const handleClick = () => {
    (window as any).openOpportunityForm?.({ editOpportunity: opp });
  };

  const isAINative = company?.ai_native || viaCompany?.ai_native;

  return (
    <Draggable draggableId={opp.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={handleClick}
          className={`mb-2 rounded-lg border bg-card p-3 text-sm cursor-pointer hover:shadow-md transition-all ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
        >
          <div className="flex justify-between items-start">
            <div className="font-medium pr-2 line-clamp-2">{opp.role_title}</div>
            <div className={`text-[10px] px-1.5 py-0.5 rounded ${STAGE_COLORS[opp.stage] || 'bg-muted'}`}>
              {opp.priority}
            </div>
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            {company?.name}
            {viaCompany && <span className="text-amber-600"> via {viaCompany.name}</span>}
            {isAINative && <span className="ai-native ml-1 px-1 rounded text-[9px]">AI</span>}
          </div>

          {(opp.ote || opp.equity) && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              {opp.ote ? `$${opp.ote.toLocaleString()}` : ''} {opp.equity ? `• ${opp.equity}` : ''}
            </div>
          )}

          {nextAction && (
            <div className="mt-2 text-[11px] bg-muted/50 p-1.5 rounded line-clamp-1">
              <span className="font-medium">Next:</span> {nextAction.title}
              {nextAction.due && ` (${nextAction.due})`}
            </div>
          )}

          {opp.notes && (
            <div className="mt-1 text-[10px] text-muted-foreground line-clamp-1 italic">"{opp.notes}"</div>
          )}
        </div>
      )}
    </Draggable>
  );
}
