import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { useAppStore } from '@/lib/store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { OpportunityFormModal } from './OpportunityFormModal';
import { toast } from 'sonner';
import type { Opportunity } from '@/lib/types';
import { STAGES, PRIORITIES } from '@/lib/constants';

const columnHelper = createColumnHelper<any>();

export default function OpportunitiesView() {
  const { data, getCompany, deleteOpportunity } = useAppStore();
  const [search, setSearch] = React.useState('');
  const [stageFilter, setStageFilter] = React.useState<string>('');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingOpp, setEditingOpp] = React.useState<Opportunity | undefined>(undefined);

  const allOpps = data.opportunities;

  const filtered = React.useMemo(() => {
    return allOpps.filter((o: any) => {
      const matchesSearch = o.role_title.toLowerCase().includes(search.toLowerCase()) ||
        (getCompany(o.company_id)?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStage = !stageFilter || o.stage === stageFilter;
      const matchesPriority = !priorityFilter || o.priority === priorityFilter;
      return matchesSearch && matchesStage && matchesPriority;
    });
  }, [allOpps, search, stageFilter, priorityFilter, getCompany]);

  const columns = [
    columnHelper.accessor('role_title', {
      header: 'Role',
      cell: (info: any) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row: any) => {
      const company = getCompany(row.company_id);
      const via = row.via_company_id ? getCompany(row.via_company_id) : null;
      return `${company?.name || '?'} ${via ? `via ${via.name}` : ''}`;
    }, {
      id: 'company',
      header: 'Company',
    }),
    columnHelper.accessor('stage', {
      header: 'Stage',
      cell: (info: any) => <span className="stage-badge" style={{background: '#f1f5f9'}}>{info.getValue()}</span>,
    }),
    columnHelper.accessor('priority', { header: 'Priority' }),
    columnHelper.accessor('ote', {
      header: 'OTE',
      cell: (info: any) => info.getValue() ? `$${info.getValue().toLocaleString()}` : '—',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const o = row.original;
        return (
          <div className="flex gap-1 text-xs">
            <button onClick={() => { (window as any).openOpportunityDetail?.(o); }} className="underline">View</button>
            <button onClick={() => { setEditingOpp(o); setFormOpen(true); }} className="underline">Edit</button>
            <button onClick={() => {
              if (confirm('Delete this opportunity?')) {
                deleteOpportunity(o.id);
                toast('Opportunity deleted');
              }
            }} className="underline text-destructive">Delete</button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const openNew = () => {
    setEditingOpp(undefined);
    setFormOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground text-sm">Basic list + full CRUD form. Rich detail in PR6.</p>
        </div>
        <Button onClick={openNew}>+ New Opportunity</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 items-end flex-wrap">
        <div>
          <label className="text-xs block mb-1">Search</label>
          <Input 
            placeholder="Role or company..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="max-w-[200px]" 
          />
        </div>
        <div>
          <label className="text-xs block mb-1">Stage</label>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="border rounded p-2 text-sm bg-background">
            <option value="">All</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs block mb-1">Priority</label>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="border rounded p-2 text-sm bg-background">
            <option value="">All</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} opportunities
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup: any) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <th key={header.id} className="text-left p-3 font-medium border-b">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No opportunities. Add one or load sample data.</td></tr>
            )}
            {table.getRowModel().rows.map((row: any) => (
              <tr key={row.id} className="hover:bg-muted/30">
                {row.getVisibleCells().map((cell: any) => (
                  <td key={cell.id} className="p-3 align-top">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OpportunityFormModal 
        isOpen={formOpen} 
        onClose={() => { setFormOpen(false); setEditingOpp(undefined); }} 
        opportunity={editingOpp} 
      />

    </div>
  );
}

