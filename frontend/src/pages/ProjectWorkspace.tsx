import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, downloadPost, pollJob, type Project, type Diagnostic, type Submission, type Edital } from '../lib/api'

type Tab = 'projeto' | 'memoria' | 'chat' | 'diag' | 'sections' | 'submissions' | 'notas' | 'export'

interface Msg { id: string; role: 'user' | 'assistant'; content: string; created_at: string }

const DIM_LABELS: Record<string, string> = {
  conceito: 'Conceito', narrativa: 'Narrativa', orcamento: 'Orçamento',
  equipe: 'Equipe', contrapartidas: 'Contrapartidas',
  acessibilidade: 'Acessibilidade', documentacao: 'Documentação',
}

const SECTIONS: { id: string; label: string }[] = [
  { id: 'summary', label: 'Resumo' }, { id: 'justification', label: 'Justificativa' },
  { id: 'objectives', label: 'Objetivos' }, { id: 'target_audience', label: 'Público-alvo' },
  { id: 'accessibility', label: 'Acessibilidade' }, { id: 'counterparts', label: 'Contrapartidas' },
  { id: 'schedule', label: 'Cronograma' }, { id: 'team', label: 'Equipe' },
  { id: 'communication', label: 'Comunicação' }, { id: 'budget', label: 'Orçamento' },
]
const AREAS = ['Audiovisual', 'Música', 'Teatro', 'Dança', 'Artes Visuais', 'Literatura', 'Patrimônio', 'Cultura Popular', 'Circo', 'Outro']

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function List({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items?.length) return null
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-2">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-ink-soft flex gap-2"><span style={{ color }} className="mt-0.5">•</span><span>{it}</span></li>
        ))}
      </ul>
    </div>
  )
}

function ProjectTab({ project, onChange }: { project: Project | null; onChange: (p: Project) => void }) {
  const map = (p: Project) => ({
    name: p.name || '', area: p.area || '', city: p.city || '', state: p.state || '',
    target_aud: p.target_aud || '', phase: p.phase || '',
    budget_approx: p.budget_approx != null ? String(p.budget_approx) : '',
    deadline: p.deadline || '', objective: p.objective || '', description: p.description || '',
  })
  const navigate = useNavigate()
  const [form, setForm] = useState(() => (project ? map(project) : null))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => { if (project) setForm(map(project)) }, [project?.id])
  if (!project || !form) return null

  async function del() {
    if (!confirm('Excluir este projeto? Esta ação não pode ser desfeita.')) return
    await api.delete(`/projects/${project!.id}`)
    navigate('/dashboard')
  }
  const set = (k: string, v: string) => setForm((f) => ({ ...f!, [k]: v }))

  async function save() {
    setSaving(true); setStatus(null)
    try {
      const updated = await api.patch<Project>(`/projects/${project!.id}`, {
        ...form,
        budget_approx: form!.budget_approx ? Number(form!.budget_approx) : null,
        deadline: form!.deadline || null,
      })
      onChange(updated)
      setStatus('Salvo. A memória do projeto vai atualizar em instantes.')
    } catch (e) { setStatus(`Erro: ${(e as Error).message}`) }
    finally { setSaving(false) }
  }

  return (
    <div className="card-pad space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-ink">Dados do projeto</h2>
        <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? 'Salvando…' : 'Salvar'}</button>
      </div>
      {status && <div className="text-sm text-moss">{status}</div>}

      <div><label className="label">Nome</label>
        <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Área</label>
          <select className="input" value={form.area} onChange={(e) => set('area', e.target.value)}>
            <option value="">—</option>{AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select></div>
        <div><label className="label">Fase</label>
          <select className="input" value={form.phase} onChange={(e) => set('phase', e.target.value)}>
            <option value="">—</option>
            <option value="ideia">Ideia</option>
            <option value="desenvolvimento">Em desenvolvimento</option>
            <option value="pronto">Pronto para captar</option>
          </select></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2"><label className="label">Cidade</label>
          <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
        <div><label className="label">UF</label>
          <input className="input" maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Orçamento (R$)</label>
          <input className="input" type="number" value={form.budget_approx} onChange={(e) => set('budget_approx', e.target.value)} /></div>
        <div><label className="label">Prazo</label>
          <input className="input" type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} /></div>
      </div>

      <div><label className="label">Público-alvo</label>
        <input className="input" value={form.target_aud} onChange={(e) => set('target_aud', e.target.value)} /></div>
      <div><label className="label">Objetivo</label>
        <input className="input" value={form.objective} onChange={(e) => set('objective', e.target.value)} /></div>
      <div><label className="label">Descrição</label>
        <textarea className="input h-32 resize-none" value={form.description} onChange={(e) => set('description', e.target.value)} /></div>

      <div className="pt-4 border-t border-line">
        <button onClick={del} className="text-sm text-terracotta hover:underline">Excluir projeto</button>
      </div>
    </div>
  )
}

function NotesTab({ project, onChange }: { project: Project | null; onChange: (p: Project) => void }) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  useEffect(() => { setNotes(project?.notes || '') }, [project?.id])

  async function save() {
    if (!project) return
    setSaving(true); setStatus(null)
    try {
      onChange(await api.patch<Project>(`/projects/${project.id}`, { notes }))
      setStatus('Notas salvas.')
    } catch (e) { setStatus(`Erro: ${(e as Error).message}`) }
    finally { setSaving(false) }
  }

  return (
    <div className="card-pad">
      <h2 className="font-display text-2xl font-bold text-ink mb-1">Notas</h2>
      <p className="text-xs text-ink-soft mb-4">Suas anotações livres sobre o desenvolvimento do projeto (não entram na IA).</p>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
        placeholder="Anote ideias, contatos, pendências, links…"
        className="input h-96 resize-y leading-relaxed" />
      <div className="flex items-center gap-3 mt-3">
        <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? 'Salvando…' : 'Salvar notas'}</button>
        {status && <span className="text-sm text-ink-soft">{status}</span>}
      </div>
    </div>
  )
}

function ChatTab({ id }: { id: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { api.get<Msg[]>(`/projects/${id}/chat`).then(setMsgs).catch(() => {}) }, [id])

  async function send() {
    const content = input.trim()
    if (!content || busy) return
    setBusy(true); setError(null); setInput('')
    const optimistic: Msg = { id: 'tmp', role: 'user', content, created_at: '' }
    setMsgs((m) => [...m, optimistic])
    try {
      const reply = await api.post<Msg>(`/projects/${id}/chat`, { content })
      setMsgs((m) => [...m.filter((x) => x.id !== 'tmp'), { ...optimistic, id: 'u' + reply.id }, reply])
    } catch (e) {
      setError((e as Error).message)
      setMsgs((m) => m.filter((x) => x.id !== 'tmp'))
      setInput(content)
    } finally { setBusy(false) }
  }

  return (
    <div className="card-pad flex flex-col" style={{ minHeight: '60vh' }}>
      <h2 className="font-display text-2xl font-bold text-ink mb-1">Chat sobre o projeto</h2>
      <p className="text-xs text-ink-soft mb-4">A IA já conhece seu projeto — pergunte, peça ideias, faça brainstorming.</p>

      <div className="flex-1 space-y-3 overflow-y-auto mb-4">
        {msgs.length === 0 && <p className="text-ink-soft text-sm text-center py-10">Comece a conversa abaixo.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
              m.role === 'user' ? 'bg-ink text-paper' : 'bg-paper-2 text-ink'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div className="flex justify-start"><div className="bg-paper-2 text-ink-soft rounded-2xl px-4 py-2.5 text-sm">Pensando…</div></div>}
      </div>

      {error && <div className="text-sm text-terracotta mb-2">{error}</div>}
      <div className="flex gap-2">
        <input className="input" value={input} disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Escreva sua mensagem…" />
        <button onClick={send} disabled={busy || !input.trim()} className="btn btn-primary shrink-0">Enviar</button>
      </div>
    </div>
  )
}

function MemoryPanel({ project, onChange }: { project: Project | null; onChange: (p: Project) => void }) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [briefBusy, setBriefBusy] = useState(false)
  const pins = project?.pins || []

  async function savePins(next: string[]) {
    if (!project) return
    setBusy(true)
    try { onChange(await api.put<Project>(`/projects/${project.id}/pins`, { pins: next })) }
    finally { setBusy(false) }
  }
  const addPin = () => { const v = draft.trim(); if (v) { savePins([...pins, v]); setDraft('') } }
  const removePin = (i: number) => savePins(pins.filter((_, j) => j !== i))

  async function refreshBrief() {
    if (!project) return
    setBriefBusy(true)
    const before = project.brief
    try {
      await api.post(`/projects/${project.id}/brief`, {})
      for (let i = 0; i < 12; i++) {
        await sleep(3000)
        const p = await api.get<Project>(`/projects/${project.id}`)
        if (p.brief && p.brief !== before) { onChange(p); break }
      }
    } catch { /* ignore */ }
    finally { setBriefBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div className="card-pad">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="eyebrow mb-1">Memória do projeto</p>
            <h2 className="font-display text-2xl font-bold text-ink">Briefing</h2>
          </div>
          <button onClick={refreshBrief} disabled={briefBusy} className="btn btn-ghost">
            {briefBusy ? 'Gerando…' : 'Atualizar memória'}
          </button>
        </div>
        <p className="text-xs text-ink-soft mb-4">
          Resumo gerado pela IA, usado em toda análise. Atualiza ao salvar o projeto, ou clique acima.
        </p>
        {project?.brief ? (
          <p className="text-ink/80 leading-relaxed">{project.brief}</p>
        ) : (
          <p className="text-ink-soft text-sm">
            Sem briefing ainda. Clique "Atualizar memória" (precisa de uma IA conectada em Configurações).
          </p>
        )}
      </div>

      <div className="card-pad">
        <h3 className="font-semibold text-ink mb-1">Fatos fixados</h3>
        <p className="text-xs text-ink-soft mb-4">
          O que a IA deve sempre considerar (ex.: "já captou na Rouanet em 2023", "parceria com o Sesc").
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {pins.map((p, i) => (
            <span key={i} className="chip flex items-center gap-1.5">{p}
              <button onClick={() => removePin(i)} className="text-ink-soft hover:text-terracotta" disabled={busy}>×</button>
            </span>
          ))}
          {pins.length === 0 && <span className="text-sm text-ink-soft">Nenhum fato fixado ainda.</span>}
        </div>
        <div className="flex gap-2">
          <input className="input" value={draft} disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPin()}
            placeholder="Adicionar um fato e Enter" />
          <button onClick={addPin} disabled={busy || !draft.trim()} className="btn btn-ghost shrink-0">Fixar</button>
        </div>
      </div>
    </div>
  )
}

function DiagnosticPanel({ id }: { id: string }) {
  const [diag, setDiag] = useState<Diagnostic | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Diagnostic[]>(`/projects/${id}/diagnostics`).then((l) => l[0] && setDiag(l[0])).catch(() => {})
  }, [id])

  async function run() {
    setRunning(true); setError(null)
    try {
      const job = await api.post<{ id: string }>(`/projects/${id}/diagnose`)
      setDiag(await pollJob<Diagnostic>(job.id))
    } catch (e) { setError((e as Error).message) }
    finally { setRunning(false) }
  }

  return (
    <div className="card-pad">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Diagnóstico</h2>
        <button onClick={run} disabled={running} className="btn btn-primary">
          {running ? 'Analisando… (até 30s)' : diag ? 'Rodar de novo' : 'Rodar diagnóstico'}
        </button>
      </div>

      {error && <div className="rounded-xl bg-terracotta/8 border border-terracotta/20 text-terracotta text-sm px-4 py-3 mb-4">{error}</div>}

      {!diag && !running && (
        <div className="text-center text-ink-soft py-14">
          <p className="mb-1">Rode o diagnóstico para uma leitura honesta do projeto.</p>
          <p className="text-xs">Precisa de uma IA conectada em <Link to="/settings" className="text-petroleum underline">Configurações</Link>.</p>
        </div>
      )}

      {diag && (
        <div className="space-y-8">
          {diag.summary && (
            <div className="text-ink/85 leading-relaxed whitespace-pre-line">{diag.summary}</div>
          )}

          {diag.dimensions && Object.keys(diag.dimensions).length > 0 && (
            <div className="pt-2 border-t border-line space-y-4">
              <h3 className="text-sm font-semibold text-ink">Por dimensão</h3>
              {Object.entries(diag.dimensions).map(([k, comment]) => (
                <div key={k}>
                  <div className="text-sm font-semibold text-ink">{DIM_LABELS[k] || k}</div>
                  <p className="text-sm text-ink-soft leading-relaxed">{comment}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 pt-2 border-t border-line">
            <List title="✅ Pontos fortes" items={diag.strengths} color="#3D7A5C" />
            <List title="🔴 Fragilidades" items={diag.weaknesses} color="#C4553F" />
            <List title="⚠️ Riscos" items={diag.risks} color="#C4943A" />
            <List title="→ Próximos passos" items={diag.next_steps} color="#211C16" />
          </div>

          {diag.edital_matches?.length > 0 && (
            <div className="pt-2 border-t border-line">
              <h3 className="text-sm font-semibold text-ink mb-3">Editais compatíveis</h3>
              <ul className="space-y-2">
                {diag.edital_matches.map((m, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-ink">{m.name}</span>
                    {m.note && <span className="text-ink-soft"> — {m.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionsPanel({ id }: { id: string }) {
  const [active, setActive] = useState(SECTIONS[0].id)
  const [content, setContent] = useState('')
  const [context, setContext] = useState('')
  const [busy, setBusy] = useState<'gen' | 'save' | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    setStatus(null)
    api.get<{ content: string | null }>(`/projects/${id}/sections/${active}`)
      .then((s) => setContent(s.content || '')).catch(() => setContent(''))
  }, [id, active])

  async function generate() {
    setBusy('gen'); setStatus(null)
    try {
      const job = await api.post<{ id: string }>(`/projects/${id}/sections/${active}/generate`, { context: context || null })
      const d = await pollJob<{ content: string }>(job.id)
      setContent(d.content)
    } catch (e) { setStatus(`Erro: ${(e as Error).message}`) }
    finally { setBusy(null) }
  }
  async function save() {
    setBusy('save'); setStatus(null)
    try { await api.put(`/projects/${id}/sections/${active}`, { content }); setStatus('Seção salva.') }
    catch (e) { setStatus(`Erro: ${(e as Error).message}`) }
    finally { setBusy(null) }
  }

  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6">
      <div className="flex md:flex-col gap-1 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className={`text-left rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
              active === s.id ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-2'}`}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="card-pad">
        <div className="flex items-center gap-2 mb-3">
          <input className="input" value={context} onChange={(e) => setContext(e.target.value)}
            placeholder="Contexto opcional: Lei Rouanet, ProAC…" />
          <button onClick={generate} disabled={!!busy} className="btn btn-primary shrink-0">
            {busy === 'gen' ? 'Gerando…' : 'Gerar com IA'}
          </button>
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Gere com IA ou escreva aqui. Edite à vontade e salve."
          className="input h-80 resize-y leading-relaxed" />
        <div className="flex items-center gap-3 mt-3">
          <button onClick={save} disabled={!!busy || !content.trim()} className="btn btn-petrol">
            {busy === 'save' ? 'Salvando…' : 'Salvar seção'}
          </button>
          {status && <span className="text-sm text-ink-soft">{status}</span>}
        </div>
      </div>
    </div>
  )
}

function ExportPanel({ id }: { id: string }) {
  const [busy, setBusy] = useState<'docx' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)
  async function exp(fmt: 'docx' | 'pdf') {
    setBusy(fmt); setError(null)
    try { await downloadPost(`/projects/${id}/export`, { format: fmt }, `projeto.${fmt}`) }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(null) }
  }
  return (
    <div className="card-pad">
      <h2 className="font-display text-2xl font-bold text-ink mb-2">Exportar projeto</h2>
      <p className="text-ink-soft text-sm mb-6">Gera um documento com as seções salvas, pronto para submissão.</p>
      {error && <div className="rounded-xl bg-terracotta/8 border border-terracotta/20 text-terracotta text-sm px-4 py-3 mb-4">{error}</div>}
      <div className="flex gap-3">
        <button onClick={() => exp('docx')} disabled={!!busy} className="btn btn-primary">{busy === 'docx' ? 'Gerando…' : 'Baixar DOCX'}</button>
        <button onClick={() => exp('pdf')} disabled={!!busy} className="btn btn-ghost">{busy === 'pdf' ? 'Gerando…' : 'Baixar PDF'}</button>
      </div>
    </div>
  )
}

function SubmissionsPanel({ id }: { id: string }) {
  const navigate = useNavigate()
  const [subs, setSubs] = useState<Submission[]>([])
  const [editais, setEditais] = useState<Edital[]>([])
  const [picked, setPicked] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Submission[]>(`/submissions?project_id=${id}`).then(setSubs).catch(() => {})
    api.get<Edital[]>('/editais').then(setEditais).catch(() => {})
  }, [id])

  async function create() {
    if (!picked) return
    setBusy(true); setError(null)
    try {
      const sub = await api.post<Submission>('/submissions', { project_id: id, edital_id: picked })
      navigate(`/submission/${sub.id}`)
    } catch (e) { setError((e as Error).message); setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div className="card-pad">
        <h2 className="font-display text-2xl font-bold text-ink mb-1">Adaptar para um edital</h2>
        <p className="text-xs text-ink-soft mb-4">
          Crie uma submissão: o projeto adaptado a um edital (seções reescritas, aderência, checklist).
          Analise editais na aba <Link to="/edital/upload" className="text-petroleum underline">Editais</Link> primeiro.
        </p>
        {error && <div className="text-sm text-terracotta mb-3">{error}</div>}
        {editais.length === 0 ? (
          <p className="text-sm text-ink-soft">Nenhum edital analisado ainda.</p>
        ) : (
          <div className="flex gap-2">
            <select className="input" value={picked} onChange={(e) => setPicked(e.target.value)}>
              <option value="">Escolha um edital…</option>
              {editais.map((ed) => <option key={ed.id} value={ed.id}>{ed.title}</option>)}
            </select>
            <button onClick={create} disabled={busy || !picked} className="btn btn-primary shrink-0">
              {busy ? 'Criando…' : 'Nova submissão'}
            </button>
          </div>
        )}
      </div>

      {subs.length > 0 && (
        <div className="space-y-2">
          {subs.map((s) => (
            <Link key={s.id} to={`/submission/${s.id}`} className="card w-full block p-4 hover:border-terracotta transition-colors">
              <div className="font-medium text-ink">{s.edital_title || s.title}</div>
              <div className="text-xs text-ink-soft mt-0.5">
                {s.deadline ? `Prazo ${new Date(s.deadline).toLocaleDateString('pt-BR')}` : 'Sem prazo'}
                {s.adherence ? ' · aderência analisada' : ' · aderência pendente'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'projeto'
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true })

  useEffect(() => {
    if (id) api.get<Project>(`/projects/${id}`).then(setProject).catch(() => {})
  }, [id])

  if (!id) return null

  const TABS = [
    ['projeto', 'Projeto'], ['memoria', 'Memória'], ['chat', 'Chat'], ['diag', 'Diagnóstico'],
    ['sections', 'Seções'], ['submissions', 'Submissões'], ['notas', 'Notas'], ['export', 'Exportar'],
  ] as const

  return (
    <div>
      <Link to="/dashboard" className="text-sm text-ink-soft hover:text-terracotta">← Projetos</Link>
      <h1 className="font-display text-3xl font-bold text-ink mt-4">{project?.name || 'Projeto'}</h1>
      <div className="flex flex-wrap gap-1.5 mt-3 mb-6">
        {[project?.area, project?.city, project?.phase].filter(Boolean).map((t) => (
          <span key={t as string} className="chip">{t}</span>
        ))}
      </div>

      <div className="flex gap-1 mb-6 border-b border-line">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
              tab === k ? 'border-terracotta text-ink font-medium' : 'border-transparent text-ink-soft hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'projeto' && <ProjectTab project={project} onChange={setProject} />}
      {tab === 'memoria' && <MemoryPanel project={project} onChange={setProject} />}
      {tab === 'chat' && <ChatTab id={id} />}
      {tab === 'diag' && <DiagnosticPanel id={id} />}
      {tab === 'sections' && <SectionsPanel id={id} />}
      {tab === 'submissions' && <SubmissionsPanel id={id} />}
      {tab === 'notas' && <NotesTab project={project} onChange={setProject} />}
      {tab === 'export' && <ExportPanel id={id} />}
    </div>
  )
}
