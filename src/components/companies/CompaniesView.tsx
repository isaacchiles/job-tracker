import { useAppStore } from '@/lib/store';

export default function CompaniesView() {
  const { data, getCompaniesWithStats, addCompany } = useAppStore();
  const companies = getCompaniesWithStats();

  const handleQuickAdd = () => {
    const name = prompt('Company name?') || 'New Target Co';
    const res = addCompany({
      name,
      website: null,
      industry: null,
      funding_stage: 'Unknown',
      headcount: null,
      ai_native: false,
      hq_location: null,
      notes: null,
    });
    if (res.warning) alert(res.warning);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Your target list (live from store). Full CRUD + table in PR 3.</p>
        </div>
        <button onClick={handleQuickAdd} className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Add Company (via store)
        </button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">AI-native</th>
              <th className="text-left p-3 font-medium">Opps (primary/via)</th>
              <th className="text-left p-3 font-medium">Headcount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-muted-foreground">No companies yet. Use "Load sample data" in the top bar or the + button above.</td></tr>
            )}
            {companies.map((c: any) => (
              <tr key={c.id}>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.hasAINative && <span className="ai-native px-2 py-0.5 rounded text-xs">AI-native</span>}</td>
                <td className="p-3 text-muted-foreground">{c.primaryOppCount} / {c.viaOppCount}</td>
                <td className="p-3 text-muted-foreground">{c.headcount ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">Data: {data.companies.length} companies • Changes auto-save to localStorage.</div>
    </div>
  );
}

