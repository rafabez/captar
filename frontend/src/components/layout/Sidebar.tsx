import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { api, type Project } from '../../lib/api'

const PROJECT_TOOLS = [
  { tab: 'projeto', label: 'Projeto' },
  { tab: 'memoria', label: 'Memória' },
  { tab: 'chat', label: 'Chat' },
  { tab: 'diag', label: 'Diagnóstico' },
  { tab: 'sections', label: 'Seções' },
  { tab: 'submissions', label: 'Submissões' },
  { tab: 'notas', label: 'Notas' },
  { tab: 'export', label: 'Exportar' },
]

// --- minimal inline icons (18px, stroke=currentColor) ---
const svg = (d: string) => (p: { className?: string }) => (
  <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {d.split('|').map((path, i) => <path key={i} d={path} />)}
  </svg>
)
const IconFolder = svg('M3 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z')
const IconFile = svg('M14 3v4a1 1 0 0 0 1 1h4|M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z')
const IconGear = svg('M12 3v3|M12 18v3|M3 12h3|M18 12h3|M5.6 5.6l2.1 2.1|M16.3 16.3l2.1 2.1|M18.4 5.6l-2.1 2.1|M7.7 16.3l-2.1 2.1|M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z')
const IconChevron = svg('M9 6l6 6-6 6')
const IconPanel = svg('M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z|M9 4v16')

interface Props { collapsed: boolean; onToggle: () => void; onNavigate?: () => void; className?: string }

export default function Sidebar({ collapsed, onToggle, onNavigate, className = '' }: Props) {
  const { pathname, search } = useLocation()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsOpen, setProjectsOpen] = useState(true)

  useEffect(() => {
    api.get<Project[]>('/projects').then(setProjects).catch(() => {})
  }, [pathname])

  const inProjetos = pathname.startsWith('/dashboard') || pathname.startsWith('/project') || pathname.startsWith('/submission')
  const activeId = pathname.match(/^\/project\/([^/?]+)/)?.[1]
  const activeTab = new URLSearchParams(search).get('tab') || 'projeto'

  const itemBase = 'flex items-center gap-2.5 rounded-lg text-sm transition-colors'
  const pad = collapsed ? 'justify-center px-0 h-10 w-10 mx-auto' : 'px-3 py-2'

  function Top({ icon: Icon, label, to, active, onClick, chevron }: {
    icon: (p: { className?: string }) => ReactNode; label: string
    to?: string; active?: boolean; onClick?: () => void; chevron?: 'open' | 'closed'
  }) {
    const cls = `${itemBase} ${pad} w-full ${active ? 'bg-paper-2 text-ink font-medium' : 'text-ink-soft hover:bg-paper-2/60 hover:text-ink'}`
    const inner = (
      <>
        <Icon className="shrink-0" />
        {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
        {!collapsed && chevron && (
          <IconChevron className={`shrink-0 transition-transform ${chevron === 'open' ? 'rotate-90' : ''}`} />
        )}
      </>
    )
    return to
      ? <Link to={to} onClick={onNavigate} title={collapsed ? label : undefined} className={cls}>{inner}</Link>
      : <button onClick={onClick} title={collapsed ? label : undefined} className={cls}>{inner}</button>
  }

  return (
    <aside className={`${className} flex-col h-screen sticky top-0 shrink-0 border-r border-line bg-paper transition-[width] duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Brand + collapse */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-line">
        {!collapsed && (
          <Link to="/dashboard" onClick={onNavigate} className="flex items-baseline gap-1.5 pl-1">
            <span className="font-display text-xl font-bold text-ink">CAPTAR</span>
            <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
          </Link>
        )}
        <button onClick={onToggle} title={collapsed ? 'Expandir' : 'Recolher'}
          className={`text-ink-soft hover:text-ink rounded-lg hover:bg-paper-2 ${collapsed ? 'mx-auto w-10 h-10 flex items-center justify-center' : 'p-2'}`}>
          <IconPanel />
        </button>
      </div>

      {/* Tree */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <Top icon={IconFolder} label="Projetos" active={inProjetos}
          chevron={collapsed ? undefined : (projectsOpen ? 'open' : 'closed')}
          to={collapsed ? '/dashboard' : undefined}
          onClick={collapsed ? undefined : () => setProjectsOpen((v) => !v)} />

        {!collapsed && projectsOpen && (
          <div className="ml-3 pl-2 border-l border-line space-y-0.5">
            <Link to="/dashboard" onClick={onNavigate}
              className={`block rounded-lg px-3 py-1.5 text-sm ${pathname === '/dashboard' ? 'text-ink font-medium' : 'text-ink-soft hover:text-ink'}`}>
              Todos os projetos
            </Link>
            {projects.map((p) => {
              const open = activeId === p.id
              return (
                <div key={p.id}>
                  <Link to={`/project/${p.id}`} onClick={onNavigate}
                    className={`block rounded-lg px-3 py-1.5 text-sm truncate ${open ? 'text-ink font-medium' : 'text-ink-soft hover:text-ink'}`}>
                    {p.name}
                  </Link>
                  {open && (
                    <div className="ml-2 pl-2 border-l border-line space-y-0.5 mb-1">
                      {PROJECT_TOOLS.map((t) => (
                        <Link key={t.tab} to={`/project/${p.id}?tab=${t.tab}`} onClick={onNavigate}
                          className={`block rounded-lg px-3 py-1 text-[13px] ${
                            activeTab === t.tab ? 'text-terracotta font-medium' : 'text-ink-soft hover:text-ink'}`}>
                          {t.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="pt-1">
          <Top icon={IconFile} label="Editais" to="/edital/upload" active={pathname.startsWith('/edital')} />
          <Top icon={IconGear} label="Configurações" to="/settings" active={pathname.startsWith('/settings')} />
        </div>
      </nav>

      {/* User */}
      <div className={`border-t border-line p-3 flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
        <UserButton afterSignOutUrl="/" />
        {!collapsed && <span className="text-xs text-ink-soft truncate">Minha conta</span>}
      </div>
    </aside>
  )
}
