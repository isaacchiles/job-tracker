import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, KanbanSquare, Users, Briefcase, Moon, Sun, Download } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AppShellProps {
  children: ReactNode
}

const navItems = [
  { to: '/',               label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/kanban',         label: 'Kanban',        icon: KanbanSquare    },
  { to: '/companies',      label: 'Companies',     icon: Users           },
  { to: '/opportunities',  label: 'Opportunities', icon: Briefcase       },
]

const PAGE_TITLES: Record<string, string> = {
  '/':               'Dashboard',
  '/kanban':         'Kanban',
  '/companies':      'Companies',
  '/opportunities':  'Opportunities',
}

export default function AppShell({ children }: AppShellProps) {
  const [isDark, setIsDark] = useState(false)
  const location = useLocation()
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'JobTracker'

  useEffect(() => {
    const stored = localStorage.getItem('jobtracker:theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldDark = stored ? stored === 'dark' : prefersDark
    setIsDark(shouldDark)
    document.documentElement.classList.toggle('dark', shouldDark)
  }, [])

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('jobtracker:theme', next ? 'dark' : 'light')
  }

  const handleExport = () => {
    const state = (window as any).useAppStore?.getState?.()
    state?.exportData?.()
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Sidebar — always warm dark ──────────────────────────────────── */}
      <aside
        className="w-56 flex flex-col flex-shrink-0"
        style={{
          background: 'hsl(var(--sidebar))',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Logo */}
        <div
          className="px-4 py-[18px] flex items-center gap-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
            style={{ background: 'hsl(var(--primary))' }}
          >
            JT
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">JobTracker</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
              v{__APP_VERSION__}{__BUILD_SHA__ ? ` · ${__BUILD_SHA__}` : ''}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'sidebar-nav-active' : 'sidebar-nav-inactive'}`
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-3.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.26)' }}>
              Local · No server
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={handleExport}
                title="Export data as JSON"
                className="h-7 w-7 flex items-center justify-center rounded-md border-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={toggleDark}
                title="Toggle theme"
                className="h-7 w-7 flex items-center justify-center rounded-md border-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            By{' '}
            <a href="mailto:isaac.chiles@gmail.com" className="underline hover:text-white/40">
              Isaac Chiles
            </a>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header
          className="h-14 bg-card flex items-center px-6 justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}
        >
          <h1 className="text-base font-semibold tracking-tight">{pageTitle}</h1>

          <div className="flex items-center gap-2.5">
            {/* Global search */}
            <label
              className="flex items-center gap-2 px-3 h-[34px] rounded-lg text-sm cursor-text"
              style={{
                background: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
                width: 200,
              }}
            >
              <svg
                className="h-3.5 w-3.5 flex-shrink-0"
                style={{ color: 'hsl(var(--muted-foreground))' }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                id="global-search"
                placeholder="Search…"
                className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = (e.target as HTMLInputElement).value.toLowerCase().trim()
                    if (!q) return
                    const s = (window as any).useAppStore?.getState?.()
                    const opp = s?.data?.opportunities?.find((o: any) =>
                      o.role_title?.toLowerCase().includes(q)
                    )
                    if (opp) {
                      ;(window as any).openOpportunityDetail?.(opp)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
              />
              <kbd className="text-[11px] text-muted-foreground">/</kbd>
            </label>

            {/* Add opportunity */}
            <button
              onClick={() => (window as any).openOpportunityForm?.()}
              className="h-[34px] px-3.5 rounded-lg text-sm font-medium text-primary-foreground flex items-center gap-1.5 cursor-pointer border-none"
              style={{ background: 'hsl(var(--primary))' }}
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add opportunity
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
