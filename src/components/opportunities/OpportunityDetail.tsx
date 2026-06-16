
import { useAppStore } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import TasksSection from './TasksSection';
import ContactsSection from './ContactsSection';
import MeetingsSection from './MeetingsSection';
import type { Opportunity, PipelineStage } from '@/lib/types';
import { STAGES, ROLE_TYPES, TITLE_BUMPS, PRIORITIES } from '@/lib/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | undefined;
  onEdit?: () => void;
}

export function OpportunityDetail({ isOpen, onClose, opportunity, onEdit }: Props) {
  const { updateOpportunity, getCompany } = useAppStore();

  if (!opportunity) return null;

  const company = getCompany(opportunity.company_id);
  const viaCompany = opportunity.via_company_id ? getCompany(opportunity.via_company_id) : null;

  const handleFieldChange = (field: keyof Opportunity, value: any) => {
    updateOpportunity(opportunity.id, { [field]: value } as any);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${opportunity.role_title} @ ${company?.name || 'Unknown'}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {onEdit && <Button onClick={onEdit}>Edit Opportunity</Button>}
        </>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-auto pr-2">
        {/* Company info */}
        <div>
          <div className="text-sm text-muted-foreground">Target Company</div>
          <div className="font-medium">{company?.name} {company?.ai_native && <span className="ai-native ml-1 px-1 text-xs">AI</span>}</div>
          {viaCompany && (
            <div className="text-sm text-amber-600">Via: {viaCompany.name}</div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {opportunity.location || 'No location'} • {opportunity.work_mode} • {opportunity.source || 'Unknown source'}
          </div>
        </div>

        {/* Main editable record */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="text-xs font-medium block mb-1">Role Title</label>
            <Input 
              value={opportunity.role_title} 
              onChange={(e) => handleFieldChange('role_title', e.target.value)} 
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Stage</label>
            <select 
              value={opportunity.stage} 
              onChange={(e) => handleFieldChange('stage', e.target.value as PipelineStage)}
              className="w-full border rounded p-2 bg-background text-sm"
            >
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Role Type</label>
            <select 
              value={opportunity.role_type} 
              onChange={(e) => handleFieldChange('role_type', e.target.value)}
              className="w-full border rounded p-2 bg-background text-sm"
            >
              {ROLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Priority</label>
            <select 
              value={opportunity.priority} 
              onChange={(e) => handleFieldChange('priority', e.target.value)}
              className="w-full border rounded p-2 bg-background text-sm"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">OTE</label>
            <Input 
              type="number" 
              value={opportunity.ote || ''} 
              onChange={(e) => handleFieldChange('ote', e.target.value ? Number(e.target.value) : null)} 
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Equity</label>
            <Input 
              value={opportunity.equity || ''} 
              onChange={(e) => handleFieldChange('equity', e.target.value || null)} 
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Title Bump</label>
            <select 
              value={opportunity.title_bump} 
              onChange={(e) => handleFieldChange('title_bump', e.target.value)}
              className="w-full border rounded p-2 bg-background text-sm"
            >
              {TITLE_BUMPS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Job URL</label>
            <Input 
              value={opportunity.job_url || ''} 
              onChange={(e) => handleFieldChange('job_url', e.target.value || null)} 
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1">Why Interested</label>
          <textarea 
            className="w-full border rounded p-2 bg-background text-sm min-h-[60px]"
            value={opportunity.why_interested || ''} 
            onChange={(e) => handleFieldChange('why_interested', e.target.value || null)} 
          />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1">Notes</label>
          <textarea 
            className="w-full border rounded p-2 bg-background text-sm min-h-[60px]"
            value={opportunity.notes || ''} 
            onChange={(e) => handleFieldChange('notes', e.target.value || null)} 
          />
        </div>

        {/* Rich sub-features */}
        <div className="border-t pt-4 space-y-6">
          <TasksSection opportunity={opportunity} />
          <ContactsSection opportunity={opportunity} />
          <MeetingsSection opportunity={opportunity} />
        </div>

        <div className="text-xs text-muted-foreground">
          All changes save automatically. Click "Edit Opportunity" for the full form if needed.
        </div>
      </div>
    </Modal>
  );
}
