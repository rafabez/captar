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
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100)
  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E5E0D8" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="#C4553F" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-ink">{score}</span>
        <span className="text-xs text-ink/40">/ 100</span>
      </div>
    </div>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ink/70">{label}</span>
        <span className="text-ink/40">{value}</span>
      </div>
      <div className="h-2 bg-sand rounded-full overflow-hidden">
        <div className="h-full bg-petroleum rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function List({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items?.length) return null
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-ink/70 flex gap-2">
            <span style={{ color }}>•</span>
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
    api
      .get<Diagnostic[]>(`/projects/${id}/diagnostics`)
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
      <Link to="/dashboard" className="text-sm text-ink/40 hover:text-terracotta">← Projetos</Link>
      <h1 className="text-2xl font-bold text-ink mt-2 mb-1">{project?.name || 'Projeto'}</h1>
      <p className="text-sm text-ink/40 mb-8">
        {[project?.area, project?.city, project?.state].filter(Boolean).join(' · ')}
      </p>

      <div className="bg-white border border-sand rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">Diagnóstico</h2>
          <button
            onClick={runDiagnostic}
            disabled={running}
            className="bg-terracotta text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {running ? 'Analisando… (até 30s)' : diag ? 'Rodar de novo' : 'Rodar diagnóstico'}
          </button>
        </div>

        {error && <div className="text-sm text-terracotta mb-4">{error}</div>}

        {!diag && !running && (
          <div className="text-center text-ink/30 py-12">
            Rode o diagnóstico para ver o Projeto Score e as recomendações.
            <br />
            <span className="text-xs">
              Precisa de uma IA conectada em{' '}
              <Link to="/settings" className="text-petroleum underline">Configurações</Link>.
            </span>
          </div>
        )}

        {diag && (
          <div className="space-y-8">
            <div className="flex items-center gap-8">
              <ScoreRing score={diag.overall_score ?? 0} />
              <div className="flex-1 space-y-3">
                {Object.entries(diag.scores || {}).map(([k, v]) => (
                  <Bar key={k} label={DIM_LABELS[k] || k} value={v} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <List title="✅ Pontos fortes" items={diag.strengths} color="#1B4D5C" />
              <List title="🔴 Fragilidades" items={diag.weaknesses} color="#C4553F" />
              <List title="⚠️ Riscos" items={diag.risks} color="#C4943A" />
              <List title="→ Próximos passos" items={diag.next_steps} color="#1A1A1A" />
            </div>

            {diag.edital_matches?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">Editais compatíveis</h3>
                <div className="space-y-2">
                  {diag.edital_matches.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-ink/70 w-48">{m.name}</span>
                      <div className="flex-1 h-2 bg-sand rounded-full overflow-hidden">
                        <div className="h-full bg-ochre rounded-full" style={{ width: `${m.score}%` }} />
                      </div>
                      <span className="text-xs text-ink/40 w-10 text-right">{m.score}%</span>
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
