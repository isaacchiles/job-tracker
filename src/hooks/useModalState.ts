import { useState, useEffect, useCallback } from 'react'
import type { Opportunity } from '../lib/types'

export function useModalState() {
  // ── Opportunity form (add / edit) ────────────────────────────────────────────
  const [oppFormOpen, setOppFormOpen] = useState(false)
  const [oppEditing, setOppEditing] = useState<Opportunity | undefined>(undefined)
  const [oppPrefillCompany, setOppPrefillCompany] = useState<string | undefined>(undefined)
  const [oppPrefillStage, setOppPrefillStage] = useState<string | undefined>(undefined)

  const openOppForm = useCallback((options?: {
    prefillCompanyId?: string
    editOpportunity?: Opportunity
    prefillStage?: string
  }) => {
    if (options?.editOpportunity) {
      setOppEditing(options.editOpportunity)
      setOppPrefillCompany(undefined)
      setOppPrefillStage(undefined)
    } else {
      setOppEditing(undefined)
      setOppPrefillCompany(options?.prefillCompanyId)
      setOppPrefillStage(options?.prefillStage)
    }
    setOppFormOpen(true)
  }, [])

  const closeOppForm = useCallback(() => {
    setOppFormOpen(false)
    setOppEditing(undefined)
    setOppPrefillCompany(undefined)
    setOppPrefillStage(undefined)
  }, [])

  // ── Opportunity detail (read / tasks / contacts / meetings) ──────────────────
  const [oppDetailOpen, setOppDetailOpen] = useState(false)
  const [oppDetail, setOppDetail] = useState<Opportunity | undefined>(undefined)

  const openOppDetail = useCallback((opp: Opportunity) => {
    setOppDetail(opp)
    setOppDetailOpen(true)
  }, [])

  const closeOppDetail = useCallback(() => {
    setOppDetailOpen(false)
    setOppDetail(undefined)
  }, [])

  // Register window globals so AppShell, CompaniesView, KanbanBoard, etc. can call them.
  // These are intentionally kept for now to avoid a larger context-refactor; they will
  // be replaced by a proper React context in a future PR.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).openOpportunityForm = openOppForm
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).openOpportunityDetail = openOppDetail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).closeOpportunityDetail = closeOppDetail
  }, [openOppForm, openOppDetail, closeOppDetail])

  return {
    oppFormOpen,
    oppEditing,
    oppPrefillCompany,
    oppPrefillStage,
    openOppForm,
    closeOppForm,
    oppDetailOpen,
    oppDetail,
    openOppDetail,
    closeOppDetail,
  }
}
