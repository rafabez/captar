import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type MuralEdital } from '../lib/api'

function brl(v: number | null) {
  return v == null ? null : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Mural() {
  const [editais, setEditais] = useState<MuralEdital[]>([])
  const [loading, setLoading] = useState(true)
  const [imported, setImported] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    api.get<MuralEdital[]>('/editais/mural')
      .then(setEditais).catch(() => setEditais([]))
      .finally(() => setLoading(false))
  }, [])

  async function importEdital(id: string) {
    setBusy(id)
    try {
      await api.post(`/editais/mural/${id}/import`, {})
      setImported((m) => ({ ...m, [id]: true }))
    } catch { /* ignore */ }
    finally { setBusy(null) }
  }

  return (
    <div>
      <p className="eyebrow mb-1">Comunidade</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Mural de editais</h1>
      <p className="text-sm text-ink-soft mb-8">
        Editais compartilhados por outros produtores. Importe para sua conta e use nas suas submissões.
        Compartilhe os seus na aba <Link to="/edital/upload" className="text-petroleum underline">Editais</Link>.
      </p>

      {loading ? (
        <div className="text-ink-soft">Carregando…</div>
      ) : editais.length === 0 ? (
        <div className="card-pad text-center py-14 text-ink-soft">
          Nenhum edital no mural ainda. Seja o primeiro a compartilhar.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {editais.map((e) => (
            <div key={e.id} className="card p-6 flex flex-col">
              <h3 className="font-display text-lg font-semibold text-ink leading-snug">{e.title}</h3>
              {e.summary && <p className="text-sm text-ink-soft mt-2 line-clamp-4">{e.summary}</p>}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {e.deadline && <span className="chip">Prazo {new Date(e.deadline).toLocaleDateString('pt-BR')}</span>}
                {e.max_value != null && <span className="chip">até {brl(e.max_value)}</span>}
              </div>
              <div className="text-xs text-ink-soft mt-3">por {e.shared_by}</div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-line">
                <button onClick={() => importEdital(e.id)} disabled={busy === e.id || imported[e.id]}
                  className="btn btn-primary">
                  {imported[e.id] ? 'Importado ✓' : busy === e.id ? 'Importando…' : 'Importar pra mim'}
                </button>
                {e.source_url && (
                  <a href={e.source_url} target="_blank" rel="noreferrer" className="text-sm text-petroleum underline">
                    Link do edital
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
