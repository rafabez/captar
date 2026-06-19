import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, type Project, type Diagnostic } from '../lib/api'

const DIM_LABELS: Record<string, string> = {
  conceito: 'Conceito',
  narrativa: 'Narrativa',
  orcamento: 'Orçamento',
  equipe: 'Equipe',
  contrapartidas: 'Contrapartidas',
  acessibilidade: 'Acessibilidade',
  documentacao: 'Documentação',
}

function ScoreRing({ score }: { score: number }) {
  const r = 54
  const circ = 2 * Math.PI * r
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
        <div className="h-full bg-petroleum rounded-full"
          style={{ width: `${value}%`, transition: 'width 0.8s ease' }} />
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
          <li key={i} className="text-sm text-ink-soft flex gap-2">
            <span style={{ color }} className="mt-0.5">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [diag, setDiag] = useState<Diagnostic | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.get<Project>(`/projects/${id}`).then(setProject).catch(() => {})
    api.get<Diagnostic[]>(`/projects/${id}/diagnostics`)
      .then((list) => list[0] && setDiag(list[0]))
      .catch(() => {})
  }, [id])

  async function runDiagnostic() {
    setRunning(true)
    setError(null)
    try {
      setDiag(await api.post<Diagnostic>(`/projects/${id}/diagnose`))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <Link to="/dashboard" className="text-sm text-ink-soft hover:text-terracotta">← Projetos</Link>
      <h1 className="font-display text-3xl font-bold text-ink mt-4">{project?.name || 'Projeto'}</h1>
      <div className="flex flex-wrap gap-1.5 mt-3 mb-8">
        {[project?.area, project?.city, project?.phase].filter(Boolean).map((t) => (
          <span key={t as string} className="chip">{t}</span>
        ))}
      </div>

      <div className="card-pad">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="eyebrow mb-1">Diagnóstico de IA</p>
            <h2 className="font-display text-2xl font-bold text-ink">Maturidade do projeto</h2>
          </div>
          <button onClick={runDiagnostic} disabled={running} className="btn btn-primary">
            {running ? 'Analisando… (até 30s)' : diag ? 'Rodar de novo' : 'Rodar diagnóstico'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-terracotta/8 border border-terracotta/20 text-terracotta text-sm px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {!diag && !running && (
          <div className="text-center text-ink-soft py-14">
            <p className="mb-1">Rode o diagnóstico para ver o Projeto Score e as recomendações.</p>
            <p className="text-xs">
              Precisa de uma IA conectada em{' '}
              <Link to="/settings" className="text-petroleum underline">Configurações</Link>.
            </p>
          </div>
        )}

        {diag && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreRing score={diag.overall_score ?? 0} />
              <div className="flex-1 w-full space-y-3">
                {Object.entries(diag.scores || {}).map(([k, v]) => (
                  <Bar key={k} label={DIM_LABELS[k] || k} value={v} />
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 pt-2 border-t border-line">
              <List title="✅ Pontos fortes" items={diag.strengths} color="#1B4D5C" />
              <List title="🔴 Fragilidades" items={diag.weaknesses} color="#C4553F" />
              <List title="⚠️ Riscos" items={diag.risks} color="#C4943A" />
              <List title="→ Próximos passos" items={diag.next_steps} color="#211C16" />
            </div>

            {diag.edital_matches?.length > 0 && (
              <div className="pt-2 border-t border-line">
                <h3 className="text-sm font-semibold text-ink mb-3">Editais compatíveis</h3>
                <div className="space-y-2.5">
                  {diag.edital_matches.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-ink/80 w-48 truncate">{m.name}</span>
                      <div className="flex-1 h-2 bg-paper-2 rounded-full overflow-hidden">
                        <div className="h-full bg-ochre rounded-full" style={{ width: `${m.score}%` }} />
                      </div>
                      <span className="text-xs text-ink-soft w-10 text-right tabular-nums">{m.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
