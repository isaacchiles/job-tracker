import { useEffect, useState, useMemo } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAppStore, hydrateStore } from './lib/store'
import { createSampleData } from './lib/persistence'
import AppShell from './components/layout/AppShell'
import DashboardView from './components/dashboard/DashboardView'
import KanbanView from './components/kanban/KanbanView'
import CompaniesView from './components/companies/CompaniesView'
import OpportunitiesView from './components/opportunities/OpportunitiesView'
import { OpportunityFormModal } from './components/opportunities/OpportunityFormModal'
import { OpportunityDetail } from './components/opportunities/OpportunityDetail'
import { Modal } from './components/ui/Modal'
import { toast } from 'sonner'

function App() {
  useKeyboardShortcuts();

  // Hydrate store from localStorage on first mount (PR2 foundation)
  useEffect(() => {
    hydrateStore();
    // Expose for console debugging / manual testing of PR2 surface
    (window as any).useAppStore = useAppStore;
    (window as any).createSampleData = createSampleData;
  }, []);

  // Dev / test helpers for PR2 (visible in header area via shell, but quick actions here too)
  const { exportData, importData, data } = useAppStore();

  const [lastSaved, setLastSaved] = useState('just now');

  useEffect(() => {
    const unsub = useAppStore.subscribe(
      (s) => s.data,
      () => setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    );
    return unsub;
  }, []);

  // Compute last backup age from meta (set on every export)
  const lastBackupAge = useMemo(() => {
    const lastExp = data.meta?.last_exported_at;
    if (!lastExp) return 'Never';
    const ageMs = Date.now() - new Date(lastExp).getTime();
    const days = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days} day${days > 1 ? 's' : ''} ago`;
  }, [data.meta?.last_exported_at]);

  // #3: Intrusive backup reminder on first load if >3 days since last export
  useEffect(() => {
    const lastExp = data.meta?.last_exported_at;
    let days = 999;
    if (lastExp) {
      days = Math.floor( (Date.now() - new Date(lastExp).getTime()) / (1000*60*60*24) );
    }
    if (days >= 3) {
      setTimeout(() => {
        toast.warning(
          `It's been ${days === 999 ? 'a while' : days + ' days'} since your last backup. Your data is important — export now?`,
          {
            duration: 10000,
            action: {
              label: 'Export JSON',
              onClick: () => handleExport(),
            },
          }
        );
      }, 2500); // slightly delayed so UI settles
    } else if (!lastExp) {
      setTimeout(() => {
        toast.info('No backups yet. Export JSON or Save to file regularly to protect your important data.', { duration: 8000 });
      }, 3000);
    }
  }, []); // run once on mount

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

  const handleCSVExport = () => {
    const csvLines: string[] = [];
    csvLines.push('section,id,name,website,industry,funding_stage,headcount,ai_native,hq_location,notes,role_title,role_type,stage,priority,ote,equity,location,source,company_id,via_company_id');
    data.companies.forEach((c: any) => {
      csvLines.push(`company,${c.id},${JSON.stringify(c.name || '')},${c.website || ''},${c.industry || ''},${c.funding_stage},${c.headcount ?? ''},${c.ai_native},${c.hq_location || ''},${JSON.stringify(c.notes || '')},,,,,,,,${c.id},`);
    });
    data.opportunities.forEach((o: any) => {
      csvLines.push(`opportunity,${o.id},,,,,,,,${JSON.stringify(o.role_title || '')},${o.role_type},${o.stage},${o.priority},${o.ote ?? ''},${o.equity || ''},${o.location || ''},${o.source || ''},${o.company_id || ''},${o.via_company_id || ''}`);
    });
    const csv = csvLines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobtracker-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported (companies + opportunities)');
  };

  // PR7: Manual FS API (Chrome/Edge). One-shot open/save; full handle persistence + live auto deferred per design.
  const handleSaveToFile = async () => {
    const api = (window as any).showSaveFilePicker;
    if (!api) {
      toast.error('File System API not available here (use "Export JSON"). Chrome/Edge 86+ recommended.');
      return;
    }
    try {
      const currentData = useAppStore.getState().data;
      const handle = await api({
        suggestedName: `jobtracker-backup-${new Date().toISOString().slice(0,10)}.json`,
        types: [{ description: 'JobTracker Data', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(currentData, null, 2));
      await writable.close();
      toast.success('Saved current data to chosen file.');
    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error('Save to file failed: ' + err.message);
    }
  };

  const handleOpenFile = async () => {
    const api = (window as any).showOpenFilePicker;
    if (!api) {
      toast.info('Browser does not support direct file open. Using import wizard instead.');
      openImportWizard();
      return;
    }
    try {
      const [fileHandle] = await api({
        types: [{ description: 'JobTracker Data', accept: { 'application/json': ['.json'] } }],
      });
      const file = await fileHandle.getFile();
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Safety: export current
      exportData();
      const result = importData(parsed, 'replace');
      toast.success(`Opened file & replaced data: ${result.companiesAdded || 0} companies, ${result.opportunitiesAdded || 0} opps.`);
    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error('Open file failed: ' + err.message);
    }
  };

  // PR7: Full import wizard state (auto backup + validate + preview + replace/merge choice)
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<'backup' | 'select' | 'preview' | 'confirm'>('backup');
  const [importFileData, setImportFileData] = useState<any>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  const openImportWizard = () => {
    // Step 1: Safety - always export current first
    exportData();
    toast.info('Current data exported as backup (check downloads).');
    setImportStep('backup');
    setImportFileData(null);
    setImportPreview(null);
    setImportOpen(true);
  };

  const closeImportWizard = () => {
    setImportOpen(false);
    setImportStep('backup');
    setImportFileData(null);
    setImportPreview(null);
  };

  const proceedToFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        setImportFileData(parsed);

        // Validate lightly + build preview
        if (!parsed.companies || !parsed.opportunities) {
          throw new Error('Invalid file: missing companies or opportunities arrays');
        }
        const preview = {
          companies: parsed.companies.length,
          opps: parsed.opportunities.length,
          contacts: (parsed.companies || []).reduce((sum: number, c: any) => sum + (c.contacts?.length || 0), 0),
          version: parsed.version || 1,
          lastExported: parsed.meta?.last_exported_at || 'unknown',
        };
        setImportPreview(preview);
        setImportStep('preview');
      } catch (err: any) {
        toast.error(`Import failed to parse: ${err.message}`);
        closeImportWizard();
      }
    };
    input.click();
  };

  const executeImport = () => {
    if (!importFileData) return;
    try {
      const result = importData(importFileData, importMode);
      toast.success(`Imported (${importMode}): ${result.companiesAdded || 0} companies, ${result.opportunitiesAdded || 0} opps added`);
      closeImportWizard();
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    }
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
        {/* PR7+ data tools: export/import wizard, sample, CSV (refined from PR2) */}
        <div className="mb-4 flex flex-wrap gap-2 text-xs bg-muted/50 p-2 rounded border">
          <span className="font-medium text-amber-700">⚠️ Your job data is only in this browser. Export or "Save to file" regularly — updates won't delete it, but browser issues or file renames can!</span>
          <span className="font-mono text-muted-foreground">Data tools (PR7):</span>
          <button onClick={handleLoadSample} className="underline">Load sample data</button>
          <button onClick={handleExport} className="underline">Export JSON</button>
          <button onClick={handleCSVExport} className="underline">Export CSV</button>
          <button onClick={handleSaveToFile} className="underline">Save to file</button>
          <button onClick={handleOpenFile} className="underline">Open file</button>
          <button onClick={openImportWizard} className="underline">Import (wizard)</button>
          <span className="ml-auto text-muted-foreground">Companies: {data.companies.length} • Opps: {data.opportunities.length} • Saved: {lastSaved} • Backup: {lastBackupAge}</span>
          <input
            type="text"
            placeholder="Global search (press / )..."
            className="ml-2 px-2 py-0.5 text-xs border rounded bg-background w-44"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = (e.target as HTMLInputElement).value.toLowerCase().trim();
                if (!q) return;
                const s = (window as any).useAppStore?.getState?.();
                const comp = s?.data?.companies?.find((c: any) => c.name?.toLowerCase().includes(q));
                if (comp) {
                  alert(`Company match: ${comp.name} (view in Companies tab; in full: deep link)`);
                  (e.target as HTMLInputElement).value = '';
                  return;
                }
                const opp = s?.data?.opportunities?.find((o: any) => o.role_title?.toLowerCase().includes(q));
                if (opp) {
                  (window as any).openOpportunityDetail?.(opp);
                  (e.target as HTMLInputElement).value = '';
                } else {
                  toast.info('No match found in companies or opportunities.');
                }
              }
            }}
          />
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

        {/* PR7: Import Wizard Modal - auto backup + validate + preview + mode choice */}
        <Modal isOpen={importOpen} onClose={closeImportWizard} title="Import Data Wizard">
          <div className="space-y-4 text-sm">
            {importStep === 'backup' && (
              <>
                <p><strong>Safety step:</strong> Your current data was just auto-exported as a timestamped backup (check your Downloads folder).</p>
                <p>Click below to select the JSON file you want to import.</p>
                <button onClick={() => setImportStep('select')} className="mt-2 px-4 py-2 border rounded text-sm hover:bg-accent">Continue to file select</button>
              </>
            )}
            {importStep === 'select' && (
              <>
                <p>Select a valid jobtracker .json file.</p>
                <button onClick={proceedToFileSelect} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">Choose JSON file...</button>
              </>
            )}
            {importStep === 'preview' && importPreview && (
              <>
                <div className="p-3 bg-muted rounded">
                  <div>Companies: {importPreview.companies} • Opportunities: {importPreview.opps}</div>
                  <div>Contacts: {importPreview.contacts} • Version: {importPreview.version}</div>
                  <div className="text-xs mt-1">Last exported: {importPreview.lastExported}</div>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Import mode:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} /> Replace (overwrite current)
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} /> Merge (smart add/update)
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={closeImportWizard} className="px-3 py-1 text-xs underline">Cancel</button>
                  <button onClick={executeImport} className="px-4 py-1 bg-primary text-primary-foreground rounded text-sm">Confirm &amp; Import ({importMode})</button>
                </div>
              </>
            )}
          </div>
        </Modal>
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
