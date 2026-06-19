import { Link } from 'react-router-dom'

export default function Dashboard() {
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-sand rounded-xl p-6 text-center text-ink/30">
          Nenhum projeto ainda. Crie seu primeiro projeto!
        </div>
      </div>
    </div>
  )
}
