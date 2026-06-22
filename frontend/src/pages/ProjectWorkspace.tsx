import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, downloadPost, pollJob, type Project, type Diagnostic, type Band } from '../lib/api'

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

const BAND: Record<Band, { label: string; cls: string }> = {
  solido: { label: 'Sólido', cls: 'bg-moss/15 text-moss' },
  atencao: { label: 'Atenção', cls: 'bg-ochre/15 text-ochre' },
  fragil: { label: 'Frágil', cls: 'bg-terracotta/15 text-terracotta' },
}

function BandBadge({ band, big }: { band: Band | null; big?: boolean }) {
  if (!band || !BAND[band]) return null
  const { label, cls } = BAND[band]
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${cls} ${
      big ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs'
    }`}>
      {label}
    </span>
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

function MemoryPanel({ project, onChange }: { project: Project | null; onChange: (p: Project) => void }) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const pins = project?.pins || []

  async function savePins(next: string[]) {
    if (!project) return
    setBusy(true)
    try {
      onChange(await api.put<Project>(`/projects/${project.id}/pins`, { pins: next }))
    } finally { setBusy(false) }
  }
  const addPin = () => { const v = draft.trim(); if (v) { savePins([...pins, v]); setDraft('') } }
  const removePin = (i: number) => savePins(pins.filter((_, j) => j !== i))

  return (
    <div className="space-y-6">
      <div className="card-pad">
        <p className="eyebrow mb-1">Memória do projeto</p>
        <h2 className="font-display text-2xl font-bold text-ink mb-1">Briefing</h2>
        <p className="text-xs text-ink-soft mb-4">
          Resumo gerado pela IA, usado em toda análise. Atualiza sozinho quando você edita o projeto.
        </p>
        {project?.brief ? (
          <p className="text-ink/80 leading-relaxed">{project.brief}</p>
        ) : (
          <p className="text-ink-soft text-sm">
            Ainda sendo gerado (ou conecte uma IA em Configurações e edite o projeto). Atualize a página em instantes.
          </p>
        )}
      </div>

      <div className="card-pad">
        <h3 className="font-semibold text-ink mb-1">Fatos fixados</h3>
        <p className="text-xs text-ink-soft mb-4">
          Coisas que a IA deve sempre considerar (ex.: "já captou na Rouanet em 2023", "parceria com o Sesc").
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {pins.map((p, i) => (
            <span key={i} className="chip flex items-center gap-1.5">
              {p}
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
    api.get<Diagnostic[]>(`/projects/${id}/diagnostics`)
      .then((l) => l[0] && setDiag(l[0])).catch(() => {})
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
          {/* Overall band + narrative */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-ink-soft">Leitura geral:</span>
              <BandBadge band={diag.overall_band} big />
            </div>
            {diag.summary && (
              <div className="text-ink/85 leading-relaxed whitespace-pre-line">{diag.summary}</div>
            )}
          </div>

          {/* Dimensions as bands */}
          {diag.dimensions && Object.keys(diag.dimensions).length > 0 && (
            <div className="pt-2 border-t border-line">
              <h3 className="text-sm font-semibold text-ink mb-3">Por dimensão</h3>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                {Object.entries(diag.dimensions).map(([k, band]) => (
                  <div key={k} className="flex items-center justify-between py-1">
                    <span className="text-sm text-ink/80">{DIM_LABELS[k] || k}</span>
                    <BandBadge band={band} />
                  </div>
                ))}
              </div>
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

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tab, setTab] = useState<'memoria' | 'diag' | 'sections' | 'export'>('diag')

  useEffect(() => {
    if (id) api.get<Project>(`/projects/${id}`).then(setProject).catch(() => {})
  }, [id])

  if (!id) return null

  const TABS = [['memoria', 'Memória'], ['diag', 'Diagnóstico'], ['sections', 'Seções'], ['export', 'Exportar']] as const

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

      {tab === 'memoria' && <MemoryPanel project={project} onChange={setProject} />}
      {tab === 'diag' && <DiagnosticPanel id={id} />}
      {tab === 'sections' && <SectionsPanel id={id} />}
      {tab === 'export' && <ExportPanel id={id} />}
    </div>
  )
}
