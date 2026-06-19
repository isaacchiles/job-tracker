import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useAppStore } from '../lib/store'
import {
  createSampleData,
  saveToStorage,
  saveFileHandle,
  loadFileHandle,
  clearFileHandle,
} from '../lib/persistence'
import { toast } from 'sonner'

export function useDataPersistence() {
  const { exportData, importData, data } = useAppStore()

  const [lastSaved, setLastSaved] = useState('just now')
  const [autoSaveFileName, setAutoSaveFileName] = useState<string | null>(null)
  // FileSystemFileHandle is not in standard TS lib; use unknown and cast at call sites
  const fileHandleRef = useRef<unknown>(null)
  // Debounce timer for file writes — prevents a write per keystroke
  const fileWriteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Handlers (declared first so useEffects below can reference them) ─────────

  const handleExport = useCallback(() => {
    exportData()
    toast.success('Exported current data as JSON (check downloads)')
  }, [exportData])

  const handleCSVExport = useCallback(() => {
    const cell = (val: unknown): string => {
      if (val == null) return ''
      let s = String(val)
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
      if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
      return s
    }
    const row = (cells: unknown[]) => cells.map(cell).join(',')
    const lines: string[] = [
      'section,id,name,website,industry,funding_stage,headcount,ai_native,hq_location,notes,' +
      'role_title,role_type,stage,priority,ote,equity,location,source,company_id,via_company_id',
    ]
    data.companies.forEach((c: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      lines.push(row(['company', c.id, c.name, c.website, c.industry, c.funding_stage,
        c.headcount, c.ai_native, c.hq_location, c.notes, '', '', '', '', '', '', '', '', c.id, '']))
    })
    data.opportunities.forEach((o: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      lines.push(row(['opportunity', o.id, '', '', '', '', '', '', '', '',
        o.role_title, o.role_type, o.stage, o.priority, o.ote, o.equity, o.location, o.source,
        o.company_id, o.via_company_id]))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jobtracker-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('CSV exported (companies + opportunities)')
  }, [data])

  const handleSaveToFile = useCallback(async () => {
    const api = (window as any).showSaveFilePicker // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!api) {
      toast.error('File System API not available (use "Export JSON"). Chrome/Edge 86+ recommended.')
      return
    }
    try {
      const currentData = useAppStore.getState().data
      const handle = await api({
        suggestedName: `jobtracker-backup-${new Date().toISOString().slice(0, 10)}.json`,
        types: [{ description: 'JobTracker Data', accept: { 'application/json': ['.json'] } }],
      })
      const writable = await (handle as any).createWritable() // eslint-disable-line @typescript-eslint/no-explicit-any
      await writable.write(JSON.stringify(currentData, null, 2))
      await writable.close()
      fileHandleRef.current = handle
      setAutoSaveFileName((handle as any).name ?? 'chosen file') // eslint-disable-line @typescript-eslint/no-explicit-any
      await saveFileHandle(handle)
      toast.success('Saved. Future changes will auto-save to this file.')
    } catch (err: unknown) {
      if ((err as any)?.name !== 'AbortError') toast.error(`Save to file failed: ${(err as Error).message}`) // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }, [])

  const stopAutoSave = useCallback(async () => {
    fileHandleRef.current = null
    setAutoSaveFileName(null)
    await clearFileHandle()
    toast.info('Stopped auto-saving to file.')
  }, [])

  // Import wizard state (declared before openImportWizard so handlers can reference each other)
  const [importOpen, setImportOpen] = useState(false)
  const [importStep, setImportStep] = useState<'backup' | 'select' | 'preview'>('backup')
  const [importFileData, setImportFileData] = useState<unknown>(null)
  const [importPreview, setImportPreview] = useState<{
    companies: number; opps: number; contacts: number; version: number; lastExported: string
  } | null>(null)
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace')

  const closeImportWizard = useCallback(() => {
    setImportOpen(false); setImportStep('backup'); setImportFileData(null); setImportPreview(null)
  }, [])

  const openImportWizard = useCallback(() => {
    setImportStep('backup'); setImportFileData(null); setImportPreview(null); setImportOpen(true)
  }, [])

  const handleOpenFile = useCallback(async () => {
    const api = (window as any).showOpenFilePicker // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!api) {
      toast.info('Browser does not support direct file open — using import wizard instead.')
      openImportWizard()
      return
    }
    try {
      const [fileHandle] = await api({
        types: [{ description: 'JobTracker Data', accept: { 'application/json': ['.json'] } }],
      })
      const file = await (fileHandle as any).getFile() // eslint-disable-line @typescript-eslint/no-explicit-any
      const parsed = JSON.parse(await file.text())
      const result = importData(parsed, 'replace')
      fileHandleRef.current = fileHandle
      setAutoSaveFileName((fileHandle as any).name ?? 'chosen file') // eslint-disable-line @typescript-eslint/no-explicit-any
      await saveFileHandle(fileHandle)
      toast.success(`Opened & loaded: ${result.companiesAdded ?? 0} companies, ${result.opportunitiesAdded ?? 0} opps.`)
    } catch (err: unknown) {
      if ((err as any)?.name !== 'AbortError') toast.error(`Open file failed: ${(err as Error).message}`) // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }, [importData, openImportWizard])

  const handleLoadSample = useCallback(() => {
    if (!window.confirm(
      'Load sample/demo data?\n\n' +
      'This will REPLACE ALL your current data with demo data.\n\n' +
      'A backup of your current data will be downloaded first.\n\nAre you sure?'
    )) return
    const sample = createSampleData()
    const result = importData(sample, 'replace')
    toast.success(`Loaded sample data: ${result.opportunitiesAdded} opps, ${result.companiesAdded} companies`)
  }, [importData])

  // ── Effects (after handlers are declared) ────────────────────────────────────

  // Update lastSaved timestamp + debounced auto-flush to chosen file on every data change
  useEffect(() => {
    const unsub = useAppStore.subscribe(
      (s) => s.data,
      () => {
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        if (fileHandleRef.current) {
          // Debounce: batch rapid edits — only write after 500ms of quiet
          if (fileWriteTimerRef.current) clearTimeout(fileWriteTimerRef.current)
          fileWriteTimerRef.current = setTimeout(async () => {
            try {
              const h = fileHandleRef.current as any // eslint-disable-line @typescript-eslint/no-explicit-any
              const current = useAppStore.getState().data
              const writable = await h.createWritable()
              await writable.write(JSON.stringify(current, null, 2))
              await writable.close()
            } catch {
              // permission or other error; will retry on next flush
            }
          }, 500)
        }
      }
    )
    return () => {
      unsub()
      if (fileWriteTimerRef.current) clearTimeout(fileWriteTimerRef.current)
    }
  }, [])

  // Backup reminder toast on first mount
  useEffect(() => {
    const lastExp = data.meta?.last_exported_at
    const now = new Date()
    let days = 999
    if (lastExp) {
      days = Math.floor((now.getTime() - new Date(lastExp).getTime()) / (1000 * 60 * 60 * 24))
    }
    if (days >= 3) {
      setTimeout(() => {
        toast.warning(
          `It's been ${days === 999 ? 'a while' : `${days} days`} since your last backup. Your data is important — export now?`,
          { duration: 10000, action: { label: 'Export JSON', onClick: handleExport } }
        )
      }, 2500)
    } else if (!lastExp) {
      setTimeout(() => {
        toast.info('No backups yet. Export JSON or Save to file regularly to protect your data.', { duration: 8000 })
      }, 3000)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Flush to localStorage + file on visibility change / tab close; restore file handle on mount
  useEffect(() => {
    const flush = async () => {
      const currentData = useAppStore.getState().data
      try { saveToStorage(currentData) } catch (e) { console.error('Flush failed', e) }
      if (fileHandleRef.current) {
        try {
          const h = fileHandleRef.current as any // eslint-disable-line @typescript-eslint/no-explicit-any
          const writable = await h.createWritable()
          await writable.write(JSON.stringify(currentData, null, 2))
          await writable.close()
        } catch { /* best effort */ }
      }
    }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', flush)

    // Restore previously chosen file handle from IDB
    ;(async () => {
      try {
        const restored = await loadFileHandle()
        if (restored) {
          const h = restored as any // eslint-disable-line @typescript-eslint/no-explicit-any
          const perm = await h.queryPermission?.({ mode: 'readwrite' }) ?? 'prompt'
          if (perm === 'prompt' || perm === 'granted') await h.requestPermission?.({ mode: 'readwrite' })
          fileHandleRef.current = restored
          setAutoSaveFileName(h.name ?? 'chosen file')
        }
      } catch { /* ignore */ }
    })()

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', flush)
    }
  }, [])

  // ── Computed ─────────────────────────────────────────────────────────────────

  const lastBackupAge = useMemo(() => {
    const lastExp = data.meta?.last_exported_at
    if (!lastExp) return 'Never'
    const ageMs = new Date().getTime() - new Date(lastExp).getTime()
    const days = Math.floor(ageMs / (1000 * 60 * 60 * 24))
    return days === 0 ? 'Today' : `${days} day${days > 1 ? 's' : ''} ago`
  }, [data.meta?.last_exported_at])

  // ── Import wizard helpers ─────────────────────────────────────────────────────

  const proceedToFileSelect = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'application/json'
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const parsed = JSON.parse(await file.text())
        if (!parsed.companies || !parsed.opportunities)
          throw new Error('Invalid file: missing companies or opportunities arrays')
        setImportFileData(parsed)
        setImportPreview({
          companies: parsed.companies.length,
          opps: parsed.opportunities.length,
          contacts: (parsed.companies as any[]).reduce((s: number, c: any) => s + (c.contacts?.length ?? 0), 0), // eslint-disable-line @typescript-eslint/no-explicit-any
          version: parsed.version ?? 1,
          lastExported: parsed.meta?.last_exported_at ?? 'unknown',
        })
        setImportStep('preview')
      } catch (err: unknown) {
        toast.error(`Import failed to parse: ${(err as Error).message}`)
        closeImportWizard()
      }
    }
    input.click()
  }, [closeImportWizard])

  const executeImport = useCallback(() => {
    if (!importFileData) return
    try {
      const result = importData(importFileData as import('../lib/types').AppData, importMode)
      toast.success(`Imported (${importMode}): ${result.companiesAdded ?? 0} companies, ${result.opportunitiesAdded ?? 0} opps added`)
      closeImportWizard()
    } catch (err: unknown) {
      toast.error(`Import failed: ${(err as Error).message}`)
    }
  }, [importFileData, importMode, importData, closeImportWizard])

  return {
    data,
    lastSaved,
    lastBackupAge,
    autoSaveFileName,
    handleExport,
    handleCSVExport,
    handleSaveToFile,
    handleOpenFile,
    handleLoadSample,
    stopAutoSave,
    importOpen,
    importStep,
    importPreview,
    importMode,
    setImportMode,
    importFileData,
    openImportWizard,
    closeImportWizard,
    proceedToFileSelect,
    executeImport,
  }
}

export type DataPersistenceState = ReturnType<typeof useDataPersistence>
