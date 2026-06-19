import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, downloadPost, type Project, type Diagnostic } from '../lib/api'

const DIM_LABELS: Record<string, string> = {
  conceito: 'Conceito', narrativa: 'Narrativa', orcamento: 'Orçamento',
  equipe: 'Equipe', contrapartidas: 'Contrapartidas',
  acessibilidade: 'Acessibilidade', documentacao: 'Documentação',
}

const SECTIONS: { id: string; label: string }[] = [
  { id: 'summary', label: 'Resumo' },
  { id: 'justification', label: 'Justificativa' },
  { id: 'objectives', label: 'Objetivos' },
  { id: 'target_audience', label: 'Público-alvo' },
  { id: 'accessibility', label: 'Acessibilidade' },
  { id: 'counterparts', label: 'Contrapartidas' },
  { id: 'schedule', label: 'Cronograma' },
  { id: 'team', label: 'Equipe' },
  { id: 'communication', label: 'Comunicação' },
  { id: 'budget', label: 'Orçamento' },
]

function ScoreRing({ score }: { score: number }) {
  const r = 54, circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100)
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#EBE5DB" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#C4553F" strokeWidth="9"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold text-ink">{score}</span>
        <span className="text-xs text-ink-soft">Projeto Score</span>
      </div>
    </div>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ink/80">{label}</span>
        <span className="text-ink-soft tabular-nums">{value}</span>
      </div>
      <div className="h-2 bg-paper-2 rounded-full overflow-hidden">
        <div className="h-full bg-petroleum rounded-full" style={{ width: `${value}%`, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

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

function DiagnosticPanel({ id }: { id: string }) {
  const [diag, setDiag] = useState<Diagnostic | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Diagnostic[]>(`/projects/${id}/diagnostics`)
      .then((l) => l[0] && setDiag(l[0])).catch(() => {})
  }, [id])

  async function run() {
    setRunning(true); setError(null)
    try { setDiag(await api.post<Diagnostic>(`/projects/${id}/diagnose`)) }
    catch (e) { setError((e as Error).message) }
    finally { setRunning(false) }
  }

  return (
    <div className="card-pad">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Maturidade do projeto</h2>
        <button onClick={run} disabled={running} className="btn btn-primary">
          {running ? 'Analisando… (até 30s)' : diag ? 'Rodar de novo' : 'Rodar diagnóstico'}
        </button>
      </div>

      {error && <div className="rounded-xl bg-terracotta/8 border border-terracotta/20 text-terracotta text-sm px-4 py-3 mb-4">{error}</div>}

      {!diag && !running && (
        <div className="text-center text-ink-soft py-14">
          <p className="mb-1">Rode o diagnóstico para ver o Projeto Score e as recomendações.</p>
          <p className="text-xs">Precisa de uma IA conectada em <Link to="/settings" className="text-petroleum underline">Configurações</Link>.</p>
        </div>
      )}

      {diag && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <ScoreRing score={diag.overall_score ?? 0} />
            <div className="flex-1 w-full space-y-3">
              {Object.entries(diag.scores || {}).map(([k, v]) => <Bar key={k} label={DIM_LABELS[k] || k} value={v} />)}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 pt-2 border-t border-line">
            <List title="✅ Pontos fortes" items={diag.strengths} color="#1B4D5C" />
            <List title="🔴 Fragilidades" items={diag.weaknesses} color="#C4553F" />
            <List title="⚠️ Riscos" items={diag.risks} color="#C4943A" />
            <List title="→ Próximos passos" items={diag.next_steps} color="#211C16" />
          </div>
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
      .then((s) => setContent(s.content || ''))
      .catch(() => setContent(''))
  }, [id, active])

  async function generate() {
    setBusy('gen'); setStatus(null)
    try {
      const d = await api.post<{ content: string }>(`/projects/${id}/sections/${active}/generate`, { context: context || null })
      setContent(d.content)
    } catch (e) { setStatus(`Erro: ${(e as Error).message}`) }
    finally { setBusy(null) }
  }

  async function save() {
    setBusy('save'); setStatus(null)
    try {
      await api.put(`/projects/${id}/sections/${active}`, { content })
      setStatus('Seção salva.')
    } catch (e) { setStatus(`Erro: ${(e as Error).message}`) }
    finally { setBusy(null) }
  }

  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6">
      <div className="flex md:flex-col gap-1 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className={`text-left rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
              active === s.id ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-2'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="card-pad">
        <div className="flex items-center gap-2 mb-3">
          <input className="input" value={context} onChange={(e) => setContext(e.target.value)}
            placeholder="Contexto opcional: Lei Rouanet, ProAC, edital municipal…" />
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
      <p className="text-ink-soft text-sm mb-6">
        Gera um documento com todas as seções salvas, pronto para submissão.
        Salve as seções na aba Seções antes de exportar.
      </p>
      {error && <div className="rounded-xl bg-terracotta/8 border border-terracotta/20 text-terracotta text-sm px-4 py-3 mb-4">{error}</div>}
      <div className="flex gap-3">
        <button onClick={() => exp('docx')} disabled={!!busy} className="btn btn-primary">
          {busy === 'docx' ? 'Gerando…' : 'Baixar DOCX'}
        </button>
        <button onClick={() => exp('pdf')} disabled={!!busy} className="btn btn-ghost">
          {busy === 'pdf' ? 'Gerando…' : 'Baixar PDF'}
        </button>
      </div>
    </div>
  )
}

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tab, setTab] = useState<'diag' | 'sections' | 'export'>('diag')

  useEffect(() => {
    if (id) api.get<Project>(`/projects/${id}`).then(setProject).catch(() => {})
  }, [id])

  if (!id) return null

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
        {([['diag', 'Diagnóstico'], ['sections', 'Seções'], ['export', 'Exportar']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
              tab === k ? 'border-terracotta text-ink font-medium' : 'border-transparent text-ink-soft hover:text-ink'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'diag' && <DiagnosticPanel id={id} />}
      {tab === 'sections' && <SectionsPanel id={id} />}
      {tab === 'export' && <ExportPanel id={id} />}
    </div>
  )
}
