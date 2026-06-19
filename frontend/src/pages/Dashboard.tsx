import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Project } from '../lib/api'

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Project[]>('/projects')
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow mb-1">Workspace</p>
          <h1 className="font-display text-3xl font-bold text-ink">Meus projetos</h1>
        </div>
        <Link to="/project/new" className="btn btn-primary">+ Novo projeto</Link>
      </div>

      {loading ? (
        <div className="text-ink-soft">Carregando…</div>
      ) : projects.length === 0 ? (
        <div className="card-pad text-center py-16">
          <div className="font-display text-xl text-ink mb-2">Nenhum projeto ainda</div>
          <p className="text-ink-soft text-sm mb-6">
            Crie seu primeiro projeto e rode um diagnóstico em minutos.
          </p>
          <Link to="/project/new" className="btn btn-primary">Criar primeiro projeto</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/project/${p.id}`}
              className="card p-6 hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              <h3 className="font-display text-xl font-semibold text-ink leading-snug">{p.name}</h3>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {[p.area, p.city && `${p.city}${p.state ? '/' + p.state : ''}`]
                  .filter(Boolean)
                  .map((t) => (
                    <span key={t as string} className="chip">{t}</span>
                  ))}
              </div>
              <div className="text-xs text-ink-soft mt-4">
                {p.status} · {new Date(p.updated_at).toLocaleDateString('pt-BR')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
