import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import Sidebar from './Sidebar'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('captar_sb') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggle = () =>
    setCollapsed((v) => {
      localStorage.setItem('captar_sb', v ? '0' : '1')
      return !v
    })

  return (
    <div className="min-h-screen flex bg-paper bg-grain">
      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex" collapsed={collapsed} onToggle={toggle} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setMobileOpen(false)} />
          <Sidebar className="relative z-10 flex" collapsed={false}
            onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden h-14 flex items-center justify-between px-4 border-b border-line bg-paper">
          <button onClick={() => setMobileOpen(true)} className="text-ink p-1" aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/dashboard" className="font-display text-lg font-bold text-ink">CAPTAR</Link>
          <UserButton afterSignOutUrl="/" />
        </div>

        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-6 py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
