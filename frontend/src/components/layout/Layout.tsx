import { Outlet, Link } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'

export default function Layout() {
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-sand bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold text-ink">
            CAPTAR
          </Link>

          <nav className="flex items-center gap-6 text-sm text-ink/70">
            <Link to="/dashboard" className="hover:text-ink transition-colors">
              Projetos
            </Link>
            <Link to="/edital/upload" className="hover:text-ink transition-colors">
              Editais
            </Link>
            <Link to="/settings" className="hover:text-ink transition-colors">
              Configurações
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-ink/50 hidden sm:inline">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
