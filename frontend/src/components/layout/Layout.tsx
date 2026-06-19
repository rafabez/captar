import { Outlet, Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'

const NAV = [
  { to: '/dashboard', label: 'Projetos' },
  { to: '/edital/upload', label: 'Editais' },
  { to: '/plans', label: 'Planos' },
  { to: '/settings', label: 'Configurações' },
]

export default function Layout() {
  const { pathname } = useLocation()
  const active = (to: string) =>
    to === '/dashboard'
      ? pathname.startsWith('/dashboard') || pathname.startsWith('/project')
      : pathname.startsWith(to)

  return (
    <div className="min-h-screen bg-paper bg-grain">
      <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-ink">CAPTAR</span>
            <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  active(n.to)
                    ? 'bg-ink text-paper'
                    : 'text-ink-soft hover:text-ink hover:bg-paper-2'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
