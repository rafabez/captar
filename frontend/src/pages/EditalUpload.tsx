import { useEffect, useRef, useState } from 'react'
import { api, uploadFile, type Edital } from '../lib/api'

function brl(v: number | null) {
  if (v == null) return null
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Result({ e }: { e: Edital }) {
  return (
    <div className="card-pad space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">{e.title}</h2>
        <p className="text-ink-soft mt-2">{e.summary}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {e.deadline && <span className="chip">Prazo: {new Date(e.deadline).toLocaleDateString('pt-BR')}</span>}
        {e.max_value != null && <span className="chip">Até {brl(e.max_value)}</span>}
      </div>

      {e.eligibility && Object.keys(e.eligibility).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">Quem pode participar</h3>
          <ul className="space-y-1.5">
            {Object.entries(e.eligibility).map(([k, v]) => (
              <li key={k} className="text-sm text-ink-soft flex gap-2">
                <span>{v ? '✅' : '❌'}</span>{k}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
        {e.requirements?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-ink mb-2">Documentos exigidos</h3>
            <ul className="space-y-1.5">
              {e.requirements.map((r, i) => (
                <li key={i} className="text-sm text-ink-soft flex gap-2"><span className="text-terracotta">•</span>{r}</li>
              ))}
            </ul>
          </div>
        )}
        {e.criteria?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-ink mb-2">Critérios de avaliação</h3>
            <ul className="space-y-1.5">
              {e.criteria.map((c, i) => (
                <li key={i} className="text-sm text-ink-soft flex gap-2"><span className="text-petroleum">•</span>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EditalUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Edital | null>(null)
  const [recent, setRecent] = useState<Edital[]>([])

  const loadRecent = () => api.get<Edital[]>('/editais').then(setRecent).catch(() => {})
  useEffect(() => { loadRecent() }, [])

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.type !== 'application/pdf') return setError('Envie um arquivo PDF.')
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const e = await uploadFile<Edital>('/editais/upload', file)
      setResult(e)
      await loadRecent()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="eyebrow mb-1">Editais</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-8">Analisar edital</h1>

      <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} />

      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
        className={`card border-dashed text-center py-14 cursor-pointer transition-colors ${
          busy ? 'opacity-60' : 'hover:border-terracotta'
        }`}
      >
        <div className="text-4xl mb-3">📄</div>
        {busy ? (
          <p className="text-ink">Analisando edital… (até 30s)</p>
        ) : (
          <>
            <p className="text-ink mb-1">Arraste o PDF do edital aqui ou clique para selecionar</p>
            <p className="text-ink-soft text-sm">Resumo, requisitos, prazos e critérios em segundos.</p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-terracotta/8 border border-terracotta/20 text-terracotta text-sm px-4 py-3 mt-4">
          {error}
        </div>
      )}

      {result && <div className="mt-6"><Result e={result} /></div>}

      {recent.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold text-ink mb-4">Análises recentes</h2>
          <div className="space-y-2">
            {recent.map((e) => (
              <button key={e.id} onClick={() => setResult(e)}
                className="card w-full text-left p-4 hover:border-terracotta transition-colors">
                <div className="font-medium text-ink">{e.title}</div>
                <div className="text-xs text-ink-soft mt-0.5">
                  {e.deadline ? `Prazo ${new Date(e.deadline).toLocaleDateString('pt-BR')}` : 'Sem prazo'}
                  {e.max_value != null && ` · até ${brl(e.max_value)}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
