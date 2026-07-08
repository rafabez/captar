import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import ProjectNew from './pages/ProjectNew'
import ProjectWorkspace from './pages/ProjectWorkspace'
import SubmissionPage from './pages/SubmissionPage'
import Mural from './pages/Mural'
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
        <Route path="/submission/:id" element={<SubmissionPage />} />
        <Route path="/edital/upload" element={<EditalUpload />} />
        <Route path="/mural" element={<Mural />} />
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
      appearance={{
        variables: {
          colorPrimary: '#C4553F',
          colorText: '#211C16',
          colorBackground: '#FFFFFF',
          borderRadius: '0.75rem',
          fontFamily: 'Inter, sans-serif',
        },
        elements: {
          card: 'shadow-none border border-[#EBE5DB]',
          headerTitle: 'font-[Playfair_Display]',
        },
      }}
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
