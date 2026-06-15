export default function CompaniesView() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Your target list with AI-native highlights. (Full table + CRUD in PR 3)</p>
        </div>
        <button className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Add Company (stub)
        </button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Industry</th>
              <th className="text-left p-3 font-medium">AI-native</th>
              <th className="text-left p-3 font-medium">Opps</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="p-3 font-medium">Acme AI</td>
              <td className="p-3 text-muted-foreground">Enterprise AI</td>
              <td className="p-3"><span className="ai-native px-2 py-0.5 rounded text-xs">AI-native</span></td>
              <td className="p-3">2</td>
              <td className="p-3">
                <button className="text-xs underline">Add Opportunity</button>
              </td>
            </tr>
            <tr>
              <td className="p-3 font-medium text-muted-foreground italic" colSpan={5}>
                Real data + full table (search, AI filter, quick add, delete with summary) arrives in PR 3.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
