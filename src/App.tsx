import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardView from './components/dashboard/DashboardView'
import KanbanView from './components/kanban/KanbanView'
import CompaniesView from './components/companies/CompaniesView'
import OpportunitiesView from './components/opportunities/OpportunitiesView'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/kanban" element={<KanbanView />} />
          <Route path="/companies" element={<CompaniesView />} />
          <Route path="/opportunities" element={<OpportunitiesView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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
