import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppStore, hydrateStore } from './lib/store'
import { createSampleData } from './lib/persistence'
import AppShell from './components/layout/AppShell'
import DashboardView from './components/dashboard/DashboardView'
import KanbanView from './components/kanban/KanbanView'
import CompaniesView from './components/companies/CompaniesView'
import OpportunitiesView from './components/opportunities/OpportunitiesView'
import { OpportunityFormModal } from './components/opportunities/OpportunityFormModal'
import { OpportunityDetail } from './components/opportunities/OpportunityDetail'
import { toast } from 'sonner'

function App() {
  // Hydrate store from localStorage on first mount (PR2 foundation)
  useEffect(() => {
    hydrateStore();
    // Expose for console debugging / manual testing of PR2 surface
    (window as any).useAppStore = useAppStore;
    (window as any).createSampleData = createSampleData;
  }, []);

  // Dev / test helpers for PR2 (visible in header area via shell, but quick actions here too)
  const { exportData, importData, data } = useAppStore();

  const handleLoadSample = () => {
    const sample = createSampleData();
    // Always export current first (safety, per design)
    exportData();
    const result = importData(sample, 'replace');
    toast.success(`Loaded sample data (replaced): ${result.opportunitiesAdded} opps, ${result.companiesAdded} companies`);
  };

  const handleExport = () => {
    exportData();
    toast.success('Exported current data as JSON (check downloads)');
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        // Safety note: real UI in PR7 will show wizard + always pre-export
        const result = importData(parsed, 'replace');
        toast.success(`Imported (replace): ${result.opportunitiesAdded} new opps`);
      } catch (err: any) {
        toast.error(`Import failed: ${err.message}`);
      }
    };
    input.click();
  };

  // PR4/PR5: Global opportunity form for cross-view quick add (prefill from Companies/Kanban)
  const [oppFormOpen, setOppFormOpen] = useState(false);
  const [oppEditing, setOppEditing] = useState<any>(undefined);
  const [oppPrefillCompany, setOppPrefillCompany] = useState<string | undefined>(undefined);
  const [oppPrefillStage, setOppPrefillStage] = useState<string | undefined>(undefined);

  (window as any).openOpportunityForm = (options?: {prefillCompanyId?: string, editOpportunity?: any, prefillStage?: string}) => {
    if (options?.editOpportunity) {
      setOppEditing(options.editOpportunity);
      setOppPrefillCompany(undefined);
      setOppPrefillStage(undefined);
    } else {
      setOppPrefillCompany(options?.prefillCompanyId);
      setOppPrefillStage(options?.prefillStage);
      setOppEditing(undefined);
    }
    setOppFormOpen(true);
  };

  // PR6: Global opportunity detail for rich view (tasks, contacts, meetings)
  const [oppDetailOpen, setOppDetailOpen] = useState(false);
  const [oppDetail, setOppDetail] = useState<any>(undefined);

  (window as any).openOpportunityDetail = (opp: any) => {
    setOppDetail(opp);
    setOppDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppShell>
        {/* PR2 dev/test bar - will be removed/refined in later PRs */}
        <div className="mb-4 flex gap-2 text-xs bg-muted/50 p-2 rounded border">
          <span className="font-mono text-muted-foreground">PR2 foundation:</span>
          <button onClick={handleLoadSample} className="underline">Load sample data</button>
          <button onClick={handleExport} className="underline">Export JSON</button>
          <button onClick={handleImportClick} className="underline">Import JSON (replace)</button>
          <span className="ml-auto text-muted-foreground">Companies: {data.companies.length} • Opps: {data.opportunities.length}</span>
        </div>

        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/kanban" element={<KanbanView />} />
          <Route path="/companies" element={<CompaniesView />} />
          <Route path="/opportunities" element={<OpportunitiesView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <OpportunityFormModal 
          isOpen={oppFormOpen} 
          onClose={() => { setOppFormOpen(false); setOppPrefillCompany(undefined); setOppPrefillStage(undefined); setOppEditing(undefined); }} 
          opportunity={oppEditing} 
          prefillCompanyId={oppPrefillCompany} 
          prefillStage={oppPrefillStage} 
        />

        <OpportunityDetail 
          isOpen={oppDetailOpen} 
          onClose={() => { setOppDetailOpen(false); setOppDetail(undefined); }} 
          opportunity={oppDetail} 
          onEdit={() => {
            if (oppDetail) {
              setOppDetailOpen(false);
              (window as any).openOpportunityForm?.({ editOpportunity: oppDetail });
            }
          }}
        />
      </AppShell>
    </div>
  )
}

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist yet.</p>
    </div>
  )
}

export default App
