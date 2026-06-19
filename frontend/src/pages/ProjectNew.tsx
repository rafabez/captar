import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, type Project } from '../lib/api'

const AREAS = [
  'Audiovisual', 'Música', 'Teatro', 'Dança', 'Artes Visuais',
  'Literatura', 'Patrimônio', 'Cultura Popular', 'Circo', 'Outro',
]

export default function ProjectNew() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', area: '', city: '', state: '', phase: '',
    budget_approx: '', objective: '', description: '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Dê um nome ao projeto.')
    setSaving(true)
    setError(null)
    try {
      const project = await api.post<Project>('/projects', {
        ...form,
        budget_approx: form.budget_approx ? Number(form.budget_approx) : null,
      })
      navigate(`/project/${project.id}`)
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/dashboard" className="text-sm text-ink-soft hover:text-terracotta">← Projetos</Link>
      <p className="eyebrow mt-4 mb-1">Novo projeto</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-8">Conte sobre sua ideia</h1>

      <form onSubmit={submit} className="card-pad space-y-5">
        {error && <div className="text-sm text-terracotta">{error}</div>}

        <div>
          <label className="label">Nome do projeto *</label>
          <input className="input" value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ex: Festival de Cinema da Periferia" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Área</label>
            <select className="input" value={form.area} onChange={(e) => set('area', e.target.value)}>
              <option value="">Selecione…</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fase</label>
            <select className="input" value={form.phase} onChange={(e) => set('phase', e.target.value)}>
              <option value="">Selecione…</option>
              <option value="ideia">Ideia</option>
              <option value="desenvolvimento">Em desenvolvimento</option>
              <option value="pronto">Pronto para captar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="label">Cidade</label>
            <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <label className="label">UF</label>
            <input className="input" maxLength={2} value={form.state}
              onChange={(e) => set('state', e.target.value.toUpperCase())} placeholder="SP" />
          </div>
        </div>

        <div>
          <label className="label">Orçamento aproximado (R$)</label>
          <input className="input" type="number" value={form.budget_approx}
            onChange={(e) => set('budget_approx', e.target.value)} placeholder="50000" />
        </div>

        <div>
          <label className="label">Objetivo</label>
          <input className="input" value={form.objective}
            onChange={(e) => set('objective', e.target.value)}
            placeholder="O que o projeto quer alcançar?" />
        </div>

        <div>
          <label className="label">Descrição</label>
          <textarea className="input h-32 resize-none" value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Descreva o projeto: o que é, para quem, como acontece…" />
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'Criando…' : 'Criar projeto'}
        </button>
      </form>
    </div>
  )
}
