import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import ProjectNew from './pages/ProjectNew'
import ProjectWorkspace from './pages/ProjectWorkspace'
import EditalUpload from './pages/EditalUpload'
import EditalAnalysis from './pages/EditalAnalysis'
import Settings from './pages/Settings'
import Plans from './pages/Plans'
import Layout from './components/layout/Layout'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

const queryClient = new QueryClient()

function ClerkRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in/*" element={<Auth />} />
      <Route path="/sign-up/*" element={<Auth />} />

      {/* Protected */}
      <Route
        element={
          <>
            <SignedIn>
              <Layout />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/project/new" element={<ProjectNew />} />
        <Route path="/project/:id" element={<ProjectWorkspace />} />
        <Route path="/edital/upload" element={<EditalUpload />} />
        <Route path="/edital/:id" element={<EditalAnalysis />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/plans" element={<Plans />} />
      </Route>
    </Routes>
  )
}

function App() {
  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center text-ink/40">
        Clerk publishable key not configured (VITE_CLERK_PUBLISHABLE_KEY)
      </div>
    )
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ClerkRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  )
}

export default App
