import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, KanbanSquare, Users, Briefcase, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AppShellProps {
  children: ReactNode
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/kanban', label: 'Kanban', icon: KanbanSquare },
  { to: '/companies', label: 'Companies', icon: Users },
  { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
]

export default function AppShell({ children }: AppShellProps) {
  const [isDark, setIsDark] = useState(false)

  // Basic dark mode (class strategy, persisted)
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 border-r bg-card flex flex-col">
        <div className="px-4 py-4 border-b flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">J</div>
          <div>
            <div className="font-semibold tracking-tight">JobTracker</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">local • v0.1</div>
          </div>
        </div>

        <nav className="p-2 flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-3 border-t mt-auto text-xs text-muted-foreground flex items-center justify-between">
          <div>Local only • No server</div>
          <button
            onClick={toggleDark}
            className="p-1.5 rounded hover:bg-accent"
            title="Toggle theme"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b bg-card/95 backdrop-blur flex items-center px-4 justify-between">
          <div className="text-sm text-muted-foreground">
            Track • Prioritize • Follow up
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button
              className="px-3 py-1.5 rounded border text-xs hover:bg-accent"
              onClick={() => alert('Import/Export + sample data coming in later PRs (full persistence in PR2)')}
            >
              Import / Export (stub)
            </button>
            <div className="text-xs px-2 py-0.5 bg-muted rounded">PR 1 UI shell</div>
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
