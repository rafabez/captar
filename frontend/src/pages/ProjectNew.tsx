import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    if (!form.name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        budget_approx: form.budget_approx ? Number(form.budget_approx) : null,
      }
      const project = await api.post<Project>('/projects', payload)
      navigate(`/project/${project.id}`)
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  const field =
    'w-full px-4 py-2 border border-sand rounded-lg bg-white text-ink text-sm placeholder:text-ink/20 focus:outline-none focus:border-terracotta'

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-ink mb-8">Novo Projeto</h1>

      <form onSubmit={submit} className="bg-white border border-sand rounded-xl p-8 space-y-5">
        {error && <div className="text-sm text-terracotta">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Nome do projeto *</label>
          <input className={field} value={form.name}
            onChange={(e) => set('name', e.target.value)} placeholder="Ex: Festival de Cinema da Periferia" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Área</label>
            <select className={field} value={form.area} onChange={(e) => set('area', e.target.value)}>
              <option value="">Selecione…</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Fase</label>
            <select className={field} value={form.phase} onChange={(e) => set('phase', e.target.value)}>
              <option value="">Selecione…</option>
              <option value="ideia">Ideia</option>
              <option value="desenvolvimento">Em desenvolvimento</option>
              <option value="pronto">Pronto para captar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-ink mb-1">Cidade</label>
            <input className={field} value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">UF</label>
            <input className={field} maxLength={2} value={form.state}
              onChange={(e) => set('state', e.target.value.toUpperCase())} placeholder="SP" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Orçamento aproximado (R$)</label>
          <input className={field} type="number" value={form.budget_approx}
            onChange={(e) => set('budget_approx', e.target.value)} placeholder="50000" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Objetivo</label>
          <input className={field} value={form.objective}
            onChange={(e) => set('objective', e.target.value)} placeholder="O que o projeto quer alcançar?" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Descrição</label>
          <textarea className={`${field} h-28 resize-none`} value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Descreva o projeto: o que é, para quem, como acontece…" />
        </div>

        <button type="submit" disabled={saving}
          className="bg-terracotta text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Criando…' : 'Criar projeto'}
        </button>
      </form>
    </div>
  )
}
