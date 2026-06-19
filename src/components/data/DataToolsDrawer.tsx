import type { DataPersistenceState } from '../../hooks/useDataPersistence'

interface DataToolsDrawerProps {
  open: boolean
  onClose: () => void
  persistence: DataPersistenceState
}

export function DataToolsDrawer({ open, onClose, persistence }: DataToolsDrawerProps) {
  const {
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
    openImportWizard,
    closeImportWizard,
    proceedToFileSelect,
    executeImport,
  } = persistence

  if (!open && !importOpen) return null

  const showImportWizard = importOpen

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.35)' }}
        onClick={showImportWizard ? closeImportWizard : onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel — sits immediately right of the sidebar (14rem = w-56) */}
      <aside
        className="fixed top-0 bottom-0 z-50 flex flex-col bg-card shadow-2xl overflow-hidden"
        style={{
          left: '14rem',
          width: '320px',
          borderRight: '1px solid hsl(var(--border))',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={showImportWizard ? 'Import Wizard' : 'Data & Settings'}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}
        >
          <h2 className="font-semibold text-sm">
            {showImportWizard ? 'Import Data Wizard' : 'Data & Settings'}
          </h2>
          <button
            onClick={showImportWizard ? closeImportWizard : onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">

          {showImportWizard ? (
            /* ── Import wizard ──────────────────────────────────────────── */
            <div className="space-y-4">
              {importStep === 'backup' && (
                <>
                  <p className="text-muted-foreground leading-relaxed">
                    A timestamped backup of your current data will be downloaded automatically before the import is applied.
                  </p>
                  <button
                    onClick={proceedToFileSelect}
                    className="w-full px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground"
                    style={{ background: 'hsl(var(--primary))' }}
                  >
                    Choose file to import…
                  </button>
                  <button onClick={closeImportWizard} className="w-full text-xs text-muted-foreground underline">
                    Cancel
                  </button>
                </>
              )}
              {importStep === 'preview' && importPreview && (
                <>
                  <div className="p-3 rounded-lg text-xs space-y-1" style={{ background: 'hsl(var(--muted))' }}>
                    <div>{importPreview.companies} companies · {importPreview.opps} opportunities</div>
                    <div>{importPreview.contacts} contacts · schema v{importPreview.version}</div>
                    <div className="text-muted-foreground">Last exported: {importPreview.lastExported}</div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Import mode</p>
                    {(['replace', 'merge'] as const).map((mode) => (
                      <label key={mode} className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={importMode === mode}
                          onChange={() => setImportMode(mode)}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium capitalize">{mode}</span>
                          <span className="block text-xs text-muted-foreground">
                            {mode === 'replace' ? 'Overwrite all current data' : 'Smart merge — add new, update existing'}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={executeImport}
                    className="w-full px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground"
                    style={{ background: 'hsl(var(--primary))' }}
                  >
                    Confirm &amp; Import ({importMode})
                  </button>
                  <button onClick={closeImportWizard} className="w-full text-xs text-muted-foreground underline">
                    Cancel
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ── Normal drawer content ──────────────────────────────────── */
            <>
              {/* Backup section */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
                  Backup
                </p>
                <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                  <span>Last backup</span>
                  <span className={lastBackupAge === 'Never' ? 'text-destructive font-medium' : ''}>
                    {lastBackupAge}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <DrawerButton onClick={handleExport}>Export JSON</DrawerButton>
                  <DrawerButton onClick={handleCSVExport}>Export CSV</DrawerButton>
                  <DrawerButton onClick={handleSaveToFile}>Save to file</DrawerButton>
                  <DrawerButton onClick={handleOpenFile}>Open file</DrawerButton>
                </div>
                <DrawerButton onClick={openImportWizard} className="w-full mt-2">
                  Import (wizard)
                </DrawerButton>
              </section>

              <Divider />

              {/* Auto-save section */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
                  Auto-save
                </p>
                {autoSaveFileName ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-foreground truncate">{autoSaveFileName}</span>
                    </div>
                    <DrawerButton onClick={stopAutoSave} className="w-full text-destructive">
                      Stop auto-save
                    </DrawerButton>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click "Save to file" to pick a file — future changes will auto-save to it on every edit.
                  </p>
                )}
              </section>

              <Divider />

              {/* Demo data */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
                  Demo data
                </p>
                <DrawerButton onClick={handleLoadSample} className="w-full text-destructive">
                  Load sample data (replaces current)
                </DrawerButton>
              </section>

              <Divider />

              {/* Help */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
                  Help
                </p>
                <a
                  href="https://github.com/isaacchiles/job-tracker#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  View user guide (README)
                  <svg viewBox="0 0 24 24" className="h-3 w-3 ml-auto flex-shrink-0 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </section>
            </>
          )}
        </div>

        {/* Footer — data stats */}
        {!showImportWizard && (
          <div
            className="px-5 py-3 flex-shrink-0 text-xs text-muted-foreground space-y-0.5"
            style={{ borderTop: '1px solid hsl(var(--border))' }}
          >
            <div className="flex justify-between">
              <span>Companies</span><span>{data.companies.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Opportunities</span><span>{data.opportunities.length}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Saved</span><span>{lastSaved}</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

// ── Small reusable sub-components ─────────────────────────────────────────────

function Divider() {
  return <hr style={{ borderColor: 'hsl(var(--border))' }} />
}

function DrawerButton({
  onClick,
  children,
  className = '',
}: {
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-medium border hover:bg-accent transition-colors text-left ${className}`}
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      {children}
    </button>
  )
}
