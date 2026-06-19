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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-ink">Meus Projetos</h1>
        <Link
          to="/project/new"
          className="bg-terracotta text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-terracotta/90 transition-colors"
        >
          + Novo Projeto
        </Link>
      </div>

      {loading ? (
        <div className="text-ink/30">Carregando…</div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-sand rounded-xl p-8 text-center text-ink/30">
          Nenhum projeto ainda. Crie seu primeiro projeto!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/project/${p.id}`}
              className="bg-white border border-sand rounded-xl p-6 hover:border-terracotta transition-colors"
            >
              <div className="font-semibold text-ink">{p.name}</div>
              <div className="text-sm text-ink/40 mt-1">
                {[p.area, p.city, p.state].filter(Boolean).join(' · ') || 'Sem detalhes'}
              </div>
              <div className="text-xs text-ink/30 mt-3">
                {p.status} · atualizado {new Date(p.updated_at).toLocaleDateString('pt-BR')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
