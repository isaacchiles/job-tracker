import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useAppStore } from '@/lib/store';
import { 
  ROLE_TYPES, WORK_MODES, TITLE_BUMPS, STAGES, PRIORITIES 
} from '@/lib/constants';
import type { Opportunity } from '@/lib/types';

const OpportunityFormSchema = z.object({
  company_id: z.string().min(1, 'Company required'),
  via_company_id: z.string().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  role_title: z.string().min(1, 'Role title required'),
  role_type: z.enum(ROLE_TYPES as any),
  stage: z.enum(STAGES as any),
  job_url: z.string().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  location: z.string().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  source: z.string().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  priority: z.enum(PRIORITIES as any),
  ote: z.coerce.number().nullable().or(z.literal('')).transform(v => v === '' ? null : Number(v)),
  equity: z.string().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  title_bump: z.enum(TITLE_BUMPS as any),
  work_mode: z.enum(WORK_MODES as any),
  why_interested: z.string().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  notes: z.string().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  applied_at: z.string().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
});



interface Props {
  isOpen: boolean;
  onClose: () => void;
  opportunity?: Opportunity;
  prefillCompanyId?: string;
  prefillStage?: string;
}

export function OpportunityFormModal({ isOpen, onClose, opportunity, prefillCompanyId, prefillStage }: Props) {
  const { data, addOpportunity, updateOpportunity } = useAppStore();
  const companies = data.companies;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(OpportunityFormSchema) as any,
    defaultValues: opportunity ? {
      company_id: opportunity.company_id,
      via_company_id: opportunity.via_company_id || '',
      role_title: opportunity.role_title,
      role_type: opportunity.role_type,
      stage: opportunity.stage,
      job_url: opportunity.job_url || '',
      location: opportunity.location || '',
      source: opportunity.source || '',
      priority: opportunity.priority,
      ote: opportunity.ote ?? '',
      equity: opportunity.equity || '',
      title_bump: opportunity.title_bump,
      work_mode: opportunity.work_mode,
      why_interested: opportunity.why_interested || '',
      notes: opportunity.notes || '',
      applied_at: opportunity.applied_at || '',
    } : {
      company_id: prefillCompanyId || '',
      via_company_id: '',
      role_title: '',
      role_type: 'Full-time',
      stage: 'Researching',
      job_url: '',
      location: '',
      source: '',
      priority: 'Medium',
      ote: '',
      equity: '',
      title_bump: 'Same',
      work_mode: 'Hybrid',
      why_interested: '',
      notes: '',
      applied_at: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (opportunity) {
        reset({
          company_id: opportunity.company_id,
          via_company_id: opportunity.via_company_id || '',
          role_title: opportunity.role_title,
          role_type: opportunity.role_type,
          stage: opportunity.stage,
          job_url: opportunity.job_url || '',
          location: opportunity.location || '',
          source: opportunity.source || '',
          priority: opportunity.priority,
          ote: opportunity.ote ?? '',
          equity: opportunity.equity || '',
          title_bump: opportunity.title_bump,
          work_mode: opportunity.work_mode,
          why_interested: opportunity.why_interested || '',
          notes: opportunity.notes || '',
          applied_at: opportunity.applied_at || '',
        } as any);
      } else {
        reset({
          company_id: prefillCompanyId || '',
          via_company_id: '',
          role_title: '',
          role_type: 'Full-time',
          stage: prefillStage || 'Researching',
          job_url: '',
          location: '',
          source: '',
          priority: 'Medium',
          ote: '',
          equity: '',
          title_bump: 'Same',
          work_mode: 'Hybrid',
          why_interested: '',
          notes: '',
          applied_at: '',
        } as any);
      }
    }
  }, [isOpen, opportunity, prefillCompanyId, prefillStage, reset]);

  const onSubmit = (formData: any) => {
    const input = {
      company_id: formData.company_id,
      via_company_id: formData.via_company_id || null,
      role_title: formData.role_title,
      role_type: formData.role_type,
      stage: formData.stage,
      job_url: formData.job_url || null,
      location: formData.location || null,
      source: formData.source || null,
      priority: formData.priority,
      ote: formData.ote || null,
      equity: formData.equity || null,
      title_bump: formData.title_bump,
      work_mode: formData.work_mode,
      why_interested: formData.why_interested || null,
      notes: formData.notes || null,
      applied_at: formData.applied_at || null,
    };

    if (opportunity) {
      updateOpportunity(opportunity.id, input as any);
    } else {
      addOpportunity(input as any);
    }
    onClose();
  };

  const selectedCompanyId = watch('company_id');
  const viaOptions = companies.filter(c => c.id !== selectedCompanyId && c.is_contractor);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={opportunity ? 'Edit Opportunity' : 'Add Opportunity'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {opportunity ? 'Save Changes' : 'Add Opportunity'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1">Target Company *</label>
            <select {...register('company_id')} className="w-full border rounded p-2 bg-background">
              <option value="">Select company...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.ai_native ? ' (AI)' : ''}</option>
              ))}
            </select>
            {errors.company_id && <p className="text-red-500 text-xs">{String(errors.company_id.message)}</p>}
          </div>

          <div>
            <label className="block mb-1">Via / Contracting Company (optional)</label>
            <select {...register('via_company_id')} className="w-full border rounded p-2 bg-background">
              <option value="">None (direct)</option>
              {viaOptions.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1">Role Title *</label>
          <Input {...register('role_title')} placeholder="Senior Software Engineer" />
          {errors.role_title && <p className="text-red-500 text-xs">{String(errors.role_title.message)}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1">Role Type</label>
            <select {...register('role_type')} className="w-full border rounded p-2 bg-background">
              {ROLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1">Stage</label>
            <select {...register('stage')} className="w-full border rounded p-2 bg-background">
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1">Work Mode</label>
            <select {...register('work_mode')} className="w-full border rounded p-2 bg-background">
              {WORK_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1">Priority</label>
            <select {...register('priority')} className="w-full border rounded p-2 bg-background">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block mb-1">OTE (USD)</label>
            <Input type="number" {...register('ote')} placeholder="180000" />
          </div>
          <div>
            <label className="block mb-1">Equity</label>
            <Input {...register('equity')} placeholder="0.1% or 50k RSU" />
          </div>
          <div>
            <label className="block mb-1">Title Bump</label>
            <select {...register('title_bump')} className="w-full border rounded p-2 bg-background">
              {TITLE_BUMPS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1">Job URL</label>
            <Input {...register('job_url')} placeholder="https://..." />
          </div>
          <div>
            <label className="block mb-1">Location</label>
            <Input {...register('location')} placeholder="SF / Remote" />
          </div>
        </div>

        <div>
          <label className="block mb-1">Source</label>
          <Input {...register('source')} placeholder="LinkedIn, Referral, etc." />
        </div>

        <div>
          <label className="block mb-1">Why Interested</label>
          <textarea {...register('why_interested')} className="w-full border rounded p-2 bg-background min-h-[60px]" placeholder="..." />
        </div>

        <div>
          <label className="block mb-1">Notes</label>
          <textarea {...register('notes')} className="w-full border rounded p-2 bg-background min-h-[60px]" placeholder="..." />
        </div>

        <div>
          <label className="block mb-1">Applied At (optional)</label>
          <Input type="date" {...register('applied_at')} />
        </div>
      </form>
    </Modal>
  );
}
