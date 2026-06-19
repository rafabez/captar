import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project/new" element={<ProjectNew />} />
            <Route path="/project/:id" element={<ProjectWorkspace />} />
            <Route path="/edital/upload" element={<EditalUpload />} />
            <Route path="/edital/:id" element={<EditalAnalysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/plans" element={<Plans />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
