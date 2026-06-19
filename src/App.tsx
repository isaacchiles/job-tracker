import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useDataPersistence } from './hooks/useDataPersistence'
import { useModalState } from './hooks/useModalState'
import AppShell from './components/layout/AppShell'
import { DataToolsDrawer } from './components/data/DataToolsDrawer'
import DashboardView from './components/dashboard/DashboardView'
import KanbanView from './components/kanban/KanbanView'
import CompaniesView from './components/companies/CompaniesView'
import OpportunitiesView from './components/opportunities/OpportunitiesView'
import { OpportunityFormModal } from './components/opportunities/OpportunityFormModal'
import { OpportunityDetail } from './components/opportunities/OpportunityDetail'

function App() {
  useKeyboardShortcuts()
  const persistence = useDataPersistence()
  const modal = useModalState()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppShell onOpenDrawer={() => setDrawerOpen(true)}>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/kanban" element={<KanbanView />} />
          <Route path="/companies" element={<CompaniesView />} />
          <Route path="/opportunities" element={<OpportunitiesView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>

      <DataToolsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        persistence={persistence}
      />

      <OpportunityFormModal
        isOpen={modal.oppFormOpen}
        onClose={modal.closeOppForm}
        opportunity={modal.oppEditing}
        prefillCompanyId={modal.oppPrefillCompany}
        prefillStage={modal.oppPrefillStage}
      />

      <OpportunityDetail
        isOpen={modal.oppDetailOpen}
        onClose={modal.closeOppDetail}
        opportunity={modal.oppDetail}
        onEdit={() => {
          if (modal.oppDetail) {
            modal.closeOppDetail()
            modal.openOppForm({ editOpportunity: modal.oppDetail })
          }
        }}
      />
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
