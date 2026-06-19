const API_BASE = '/api'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

async function getClerkToken(): Promise<string | null> {
  try {
    // Clerk injects __clerk on window
    const clerk = (window as any).Clerk
    if (clerk?.session) {
      return await clerk.session.getToken()
    }
    return null
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const token = await getClerkToken()

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  }

  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, config)

  if (!res.ok) {
    let detail = res.statusText
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch {}
    throw new Error(detail)
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

// Multipart upload (PDF) — sends the Clerk bearer token, no JSON content-type.
export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const token = await getClerkToken()
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      detail = (await res.json()).detail || detail
    } catch {}
    throw new Error(detail)
  }
  return res.json()
}

// --- Types ---

export interface User {
  id: string
  clerk_id: string
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
  risks: string[]
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
  criteria: string[]
  status: string
  created_at: string
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
