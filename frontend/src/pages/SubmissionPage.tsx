import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, pollJob, type Submission } from '../lib/api'

const SECTIONS: { id: string; label: string }[] = [
  { id: 'summary', label: 'Resumo' }, { id: 'justification', label: 'Justificativa' },
  { id: 'objectives', label: 'Objetivos' }, { id: 'target_audience', label: 'Público-alvo' },
  { id: 'accessibility', label: 'Acessibilidade' }, { id: 'counterparts', label: 'Contrapartidas' },
  { id: 'schedule', label: 'Cronograma' }, { id: 'team', label: 'Equipe' },
  { id: 'communication', label: 'Comunicação' }, { id: 'budget', label: 'Orçamento' },
]

function List({ title, items, color }: { title: string; items?: string[]; color: string }) {
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

function Adherence({ sub, onChange }: { sub: Submission; onChange: (s: Submission) => void }) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const a = sub.adherence

  async function analyze() {
    setRunning(true); setError(null)
    try {
      const job = await api.post<{ id: string }>(`/submissions/${sub.id}/analyze`)
      await pollJob(job.id)
      onChange(await api.get<Submission>(`/submissions/${sub.id}`))
    } catch (e) { setError((e as Error).message) }
    finally { setRunning(false) }
  }

  return (
    <div className="card-pad">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl font-bold text-ink">Aderência ao edital</h2>
        <button onClick={analyze} disabled={running} className="btn btn-primary">
          {running ? 'Analisando… (até 30s)' : a ? 'Analisar de novo' : 'Analisar aderência'}
        </button>
      </div>
      {error && <div className="rounded-xl bg-terracotta/8 border border-terracotta/20 text-terracotta text-sm px-4 py-3 mb-4">{error}</div>}
      {!a && !running && (
        <p className="text-ink-soft text-sm py-6 text-center">
          Analise o quanto este projeto encaixa no edital — forças, lacunas e ajustes.
        </p>
      )}
      {a && (
        <div className="space-y-6">
          {a.summary && <div className="text-ink/85 leading-relaxed whitespace-pre-line">{a.summary}</div>}
          <div className="grid sm:grid-cols-3 gap-x-8 gap-y-6 pt-2 border-t border-line">
            <List title="✅ Já atende" items={a.strengths} color="#3D7A5C" />
            <List title="🔴 Lacunas" items={a.gaps} color="#C4553F" />
            <List title="🔧 Ajustes" items={a.adjustments} color="#C4943A" />
          </div>
        </div>
      )}
    </div>
  )
}

function Checklist({ sub, onChange }: { sub: Submission; onChange: (s: Submission) => void }) {
  const items = sub.checklist || []
  async function toggle(i: number) {
    const next = items.map((it, j) => (j === i ? { ...it, done: !it.done } : it))
    onChange(await api.put<Submission>(`/submissions/${sub.id}/checklist`, { checklist: next }))
  }
  if (items.length === 0) return null
  const done = items.filter((i) => i.done).length
  return (
    <div className="card-pad">
      <h2 className="font-display text-2xl font-bold text-ink mb-1">Checklist de requisitos</h2>
      <p className="text-xs text-ink-soft mb-4">{done}/{items.length} concluídos</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i}>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={it.done} onChange={() => toggle(i)} className="mt-1 accent-terracotta" />
              <span className={`text-sm ${it.done ? 'text-ink-soft line-through' : 'text-ink/80'}`}>{it.item}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SubSections({ id }: { id: string }) {
  const [active, setActive] = useState(SECTIONS[0].id)
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState<'gen' | 'save' | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    setStatus(null)
    api.get<{ content: string | null }>(`/submissions/${id}/sections/${active}`)
      .then((s) => setContent(s.content || '')).catch(() => setContent(''))
  }, [id, active])

  async function adapt() {
    setBusy('gen'); setStatus(null)
    try {
      const job = await api.post<{ id: string }>(`/submissions/${id}/sections/${active}/adapt`)
      const d = await pollJob<{ content: string }>(job.id)
      setContent(d.content)
    } catch (e) { setStatus(`Erro: ${(e as Error).message}`) }
    finally { setBusy(null) }
  }
  async function save() {
    setBusy('save'); setStatus(null)
    try { await api.put(`/submissions/${id}/sections/${active}`, { content }); setStatus('Seção salva.') }
    catch (e) { setStatus(`Erro: ${(e as Error).message}`) }
    finally { setBusy(null) }
  }

  return (
    <div className="card-pad">
      <h2 className="font-display text-2xl font-bold text-ink mb-1">Seções adaptadas</h2>
      <p className="text-xs text-ink-soft mb-4">Versões reescritas para este edital, sem mexer no projeto original.</p>
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
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={adapt} disabled={!!busy} className="btn btn-primary">
              {busy === 'gen' ? 'Adaptando…' : 'Adaptar com IA'}
            </button>
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Adapte com IA para este edital, ou escreva aqui."
            className="input h-80 resize-y leading-relaxed" />
          <div className="flex items-center gap-3 mt-3">
            <button onClick={save} disabled={!!busy || !content.trim()} className="btn btn-petrol">
              {busy === 'save' ? 'Salvando…' : 'Salvar seção'}
            </button>
            {status && <span className="text-sm text-ink-soft">{status}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubmissionPage() {
  const { id } = useParams<{ id: string }>()
  const [sub, setSub] = useState<Submission | null>(null)

  useEffect(() => {
    if (id) api.get<Submission>(`/submissions/${id}`).then(setSub).catch(() => {})
  }, [id])

  if (!id) return null

  return (
    <div className="space-y-6">
      <div>
        <Link to={sub ? `/project/${sub.project_id}` : '/dashboard'} className="text-sm text-ink-soft hover:text-terracotta">← Voltar ao projeto</Link>
        <p className="eyebrow mt-4 mb-1">Submissão</p>
        <h1 className="font-display text-3xl font-bold text-ink">{sub?.title || 'Submissão'}</h1>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {sub?.edital_title && <span className="chip">{sub.edital_title}</span>}
          {sub?.deadline && <span className="chip">Prazo: {new Date(sub.deadline).toLocaleDateString('pt-BR')}</span>}
        </div>
      </div>

      {sub && <Adherence sub={sub} onChange={setSub} />}
      {sub && <Checklist sub={sub} onChange={setSub} />}
      <SubSections id={id} />
    </div>
  )
}
