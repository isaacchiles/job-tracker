import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useAppStore } from '@/lib/store';
import { FUNDING_STAGES } from '@/lib/constants';
import type { Company } from '@/lib/types';

const CompanyFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url().optional().or(z.literal('')).transform(v => (v === '' || !v) ? null : v),
  industry: z.string().optional().or(z.literal('')).transform(v => (v === '' || !v) ? null : v),
  funding_stage: z.enum(FUNDING_STAGES as any),
  headcount: z.preprocess(
    (val) => (val === '' || val == null ? null : Number(val)),
    z.number().nullable()
  ),
  ai_native: z.boolean(),
  hq_location: z.string().optional().or(z.literal('')).transform(v => (v === '' || !v) ? null : v),
  notes: z.string().optional().or(z.literal('')).transform(v => (v === '' || !v) ? null : v),
});



interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: Company; // for edit
}

export function CompanyFormModal({ isOpen, onClose, company }: CompanyFormModalProps) {
  const { addCompany, updateCompany } = useAppStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(CompanyFormSchema) as any,
    defaultValues: company ? ({
      name: company.name,
      website: company.website || '',
      industry: company.industry || '',
      funding_stage: company.funding_stage,
      headcount: company.headcount ?? '',
      ai_native: company.ai_native,
      hq_location: company.hq_location || '',
      notes: company.notes || '',
    } as any) : ({
      name: '',
      website: '',
      industry: '',
      funding_stage: 'Unknown',
      headcount: '',
      ai_native: false,
      hq_location: '',
      notes: '',
    } as any),
  });

  React.useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        website: company.website || '',
        industry: company.industry || '',
        funding_stage: company.funding_stage as any,
        headcount: company.headcount as any ?? '',
        ai_native: company.ai_native,
        hq_location: company.hq_location || '',
        notes: company.notes || '',
      } as any);
    } else {
      reset({
        name: '', website: '', industry: '', funding_stage: 'Unknown' as any, headcount: '' as any,
        ai_native: false, hq_location: '', notes: '',
      } as any);
    }
  }, [company, reset, isOpen]);

  const onSubmit = (data: any) => {
    const input = {
      name: data.name,
      website: data.website || null,
      industry: data.industry || null,
      funding_stage: data.funding_stage,
      headcount: data.headcount != null && data.headcount !== '' ? Number(data.headcount) : null,
      ai_native: data.ai_native,
      hq_location: data.hq_location || null,
      notes: data.notes || null,
    };

    if (company) {
      updateCompany(company.id, input as any);
    } else {
      const res = addCompany(input as any);
      if (res.warning) {
        alert(res.warning); // temporary; will use toast in later PR
      }
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={company ? 'Edit Company' : 'Add Company'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {company ? 'Save Changes' : 'Add Company'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <Input {...register('name')} placeholder="Company name" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{String(errors.name.message || errors.name)}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <Input {...register('website')} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Industry</label>
            <Input {...register('industry')} placeholder="AI / SaaS ..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Funding Stage</label>
            <select {...register('funding_stage')} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
              {FUNDING_STAGES.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Headcount</label>
            <Input type="number" {...register('headcount')} placeholder="e.g. 150" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ai_native" {...register('ai_native')} className="h-4 w-4" />
          <label htmlFor="ai_native" className="text-sm font-medium">AI-native company</label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">HQ / Location</label>
          <Input {...register('hq_location')} placeholder="San Francisco, CA" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea {...register('notes')} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Key insights, culture notes..." />
        </div>
      </form>
    </Modal>
  );
}
