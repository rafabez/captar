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
    let detail = res.statusText || `falha na requisição (${res.status})`
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

export interface Job<T = unknown> {
  id: string
  kind: string
  status: 'queued' | 'running' | 'done' | 'error'
  result: T | null
  error: string | null
}

// Poll an async job until it finishes; resolve with its result or throw its error.
export async function pollJob<T>(
  jobId: string,
  { interval = 1500, timeout = 180000 }: { interval?: number; timeout?: number } = {},
): Promise<T> {
  const start = Date.now()
  for (;;) {
    const job = await api.get<Job<T>>(`/jobs/${jobId}`)
    if (job.status === 'done') return job.result as T
    if (job.status === 'error') throw new Error(job.error || 'Falha no processamento')
    if (Date.now() - start > timeout) throw new Error('Tempo esgotado — tente de novo')
    await new Promise((r) => setTimeout(r, interval))
  }
}

// POST that returns a binary file, and triggers a browser download.
export async function downloadPost(path: string, body: unknown, fallbackName: string): Promise<void> {
  const token = await getClerkToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let detail = res.statusText || `falha na requisição (${res.status})`
    try {
      detail = (await res.json()).detail || detail
    } catch {}
    throw new Error(detail)
  }
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition') || ''
  const name = cd.match(/filename="?([^"]+)"?/)?.[1] || fallbackName
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
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
    let detail = res.statusText || `falha na requisição (${res.status})`
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
  target_aud: string | null
  phase: string | null
  budget_approx: number | null
  deadline: string | null
  objective: string | null
  description: string | null
  notes: string | null
  status: string
  brief: string | null
  pins: string[] | null
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
  summary: string | null
  dimensions: Record<string, string>   // comentário textual por quesito
  strengths: string[]
  weaknesses: string[]
  risks: string[]
  next_steps: string[]
  edital_matches: Array<{ name: string; note: string }>
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

export interface Submission {
  id: string
  project_id: string
  edital_id: string
  title: string | null
  status: string
  adherence: {
    summary?: string
    strengths?: string[]
    gaps?: string[]
    adjustments?: string[]
  } | null
  checklist: Array<{ item: string; done: boolean }> | null
  edital_title: string | null
  deadline: string | null
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
