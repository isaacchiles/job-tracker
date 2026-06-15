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
import { CompanyFormModal } from './CompanyFormModal';
import { DeleteCompanyConfirm } from './DeleteCompanyConfirm';
import type { Company } from '@/lib/types';
import { toast } from 'sonner';
import { computeDeleteSummary } from '@/lib/utils';  // we'll make sure it's exported

const columnHelper = createColumnHelper<any>();

export default function CompaniesView() {
  const { data, getCompaniesWithStats, deleteCompany } = useAppStore();
  const [search, setSearch] = React.useState('');
  const [aiOnly, setAiOnly] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingCompany, setEditingCompany] = React.useState<Company | undefined>(undefined);
  const [deleteSummary, setDeleteSummary] = React.useState<any>(null);
  const [deletingCompany, setDeletingCompany] = React.useState<{ id: string; name: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  const allCompanies = getCompaniesWithStats();

  const filtered = React.useMemo(() => {
    return allCompanies.filter((c: any) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.industry?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesAI = !aiOnly || c.hasAINative;
      return matchesSearch && matchesAI;
    });
  }, [allCompanies, search, aiOnly]);

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info: any) => (
        <div className="font-medium">
          {info.getValue()}
          {info.row.original.hasAINative && (
            <span className="ai-native ml-2 px-1.5 py-0.5 rounded text-[10px]">AI</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('industry', {
      header: 'Industry',
      cell: (info: any) => info.getValue() || '—',
    }),
    columnHelper.accessor('funding_stage', {
      header: 'Funding',
    }),
    columnHelper.accessor('headcount', {
      header: 'Headcount',
      cell: (info: any) => info.getValue() ? info.getValue() : '—',
    }),
    columnHelper.accessor((row: any) => row.primaryOppCount + row.viaOppCount, {
      id: 'opps',
      header: 'Opps',
      cell: (info: any) => {
        const c = info.row.original;
        return `${c.primaryOppCount} primary / ${c.viaOppCount} via`;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const c = row.original;
        const company = data.companies.find((cc: any) => cc.id === c.id)!;
        return (
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => handleQuickAddOpp(c.id)}
              className="underline hover:no-underline text-primary"
            >
              + Opp
            </button>
            <button
              onClick={() => {
                setEditingCompany(company);
                setModalOpen(true);
              }}
              className="underline hover:no-underline"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteClick(c.id, c.name)}
              className="underline hover:no-underline text-destructive"
            >
              Delete
            </button>
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

  const handleAddCompany = () => {
    setEditingCompany(undefined);
    setModalOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    const currentData = useAppStore.getState().data;
    const summary = computeDeleteSummary(currentData, id);
    setDeleteSummary(summary);
    setDeletingCompany({ id, name });
    setPendingDeleteId(id);
  };

  const confirmDelete = () => {
    if (pendingDeleteId) {
      const summary = deleteCompany(pendingDeleteId);
      toast.error(`Deleted company. ${summary.removedPrimaryOpps} primary opps removed, ${summary.nulledViaOpps} via nulled.`);
    }
    setDeleteSummary(null);
    setDeletingCompany(null);
    setPendingDeleteId(null);
  };

  const cancelDelete = () => {
    setDeleteSummary(null);
    setDeletingCompany(null);
    setPendingDeleteId(null);
  };

  const handleQuickAddOpp = (companyId: string) => {
    // Use global form from App for prefill (PR4 wiring)
    (window as any).openOpportunityForm?.({ prefillCompanyId: companyId });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCompany(undefined);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Companies</h1>
          <p className="text-muted-foreground text-sm">Full vertical slice — search, AI filter, CRUD, quick opp stub</p>
        </div>
        <Button onClick={handleAddCompany}>+ Add Company</Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4 items-center">
        <Input
          placeholder="Search name or industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={aiOnly}
            onChange={(e) => setAiOnly(e.target.checked)}
          />
          AI-native only
        </label>
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {allCompanies.length} companies
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
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No companies match. Try clearing filters or add one.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row: any) => (
              <tr key={row.id} className="hover:bg-muted/30">
                {row.getVisibleCells().map((cell: any) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Persisted automatically. Use sample data from top bar if empty.
      </div>

      <CompanyFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        company={editingCompany}
      />

      <DeleteCompanyConfirm
        isOpen={!!deleteSummary}
        onClose={cancelDelete}
        summary={deleteSummary}
        companyName={deletingCompany?.name || ''}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

