const API_BASE = '/api'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, config)

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Erro na requisição')
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// --- Types ---

export interface User {
  id: string
  email: string
  full_name: string | null
  plan: string
}

export interface Project {
  id: string
  name: string
  area: string | null
  city: string | null
  state: string | null
  phase: string | null
  status: string
  score?: number
  updated_at: string
  created_at: string
}

export interface ProjectSection {
  id: string
  section_type: string
  content: string
  version: number
}

export interface Diagnostic {
  id: string
  overall_score: number
  scores: Record<string, number>
  strengths: string[]
  weaknesses: string[]
  next_steps: string[]
  edital_matches: Array<{ name: string; score: number }>
}

export interface Edital {
  id: string
  title: string
  summary: string
  eligibility: Record<string, boolean>
  deadline: string | null
  max_value: number | null
  requirements: string[]
  status: string
}

export interface Conversation {
  id: string
  title: string
  updated_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
