import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { startOpenRouterConnect, completeOpenRouterConnect } from '../lib/openrouter'

interface Provider {
  id: string
  provider: string
  is_active: boolean
  endpoint_url: string | null
  has_key: boolean
}

const KEY_PROVIDERS = [
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic Claude', placeholder: 'sk-ant-...' },
  { id: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
]

export default function Settings() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [ollama, setOllama] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const connected = (id: string) => providers.find((p) => p.provider === id && p.is_active)

  const load = () =>
    api.get<Provider[]>('/user/providers').then(setProviders).catch(() => {})

  useEffect(() => {
    completeOpenRouterConnect()
      .then((ok) => {
        if (ok) setStatus('OpenRouter conectado!')
        return load()
      })
      .catch((e) => setStatus(`Erro: ${e.message}`))
  }, [])

  async function saveKey(id: string) {
    const api_key = keys[id]?.trim()
    if (!api_key) return
    try {
      await api.post('/user/providers', { provider: id, api_key })
      setKeys((k) => ({ ...k, [id]: '' }))
      setStatus(`${id} salvo!`)
      await load()
    } catch (e) {
      setStatus(`Erro: ${(e as Error).message}`)
    }
  }

  async function saveOllama() {
    try {
      await api.post('/user/providers', {
        provider: 'ollama',
        endpoint_url: ollama.trim() || 'http://localhost:11434',
      })
      setStatus('Ollama salvo!')
      await load()
    } catch (e) {
      setStatus(`Erro: ${(e as Error).message}`)
    }
  }

  const ok = (id: string) => connected(id) && (id === 'ollama' || connected(id)?.has_key)

  return (
    <div className="max-w-xl">
      <p className="eyebrow mb-1">Configurações</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Conexão com IA</h1>
      <p className="text-sm text-ink-soft mb-8">
        Conecte sua própria IA. O CAPTAR não cobra tokens — você paga direto ao
        seu provedor, ou roda local de graça com Ollama.
      </p>

      {status && (
        <div className="rounded-xl bg-moss/10 border border-moss/20 text-moss text-sm px-4 py-2.5 mb-6">
          {status}
        </div>
      )}

      {/* OpenRouter — recommended */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">OpenRouter</span>
              <span className="chip">recomendado</span>
            </div>
            <p className="text-xs text-ink-soft mt-1">
              1 clique — acesso a OpenAI, Claude, Gemini e mais.
            </p>
          </div>
          {ok('openrouter') ? (
            <span className="text-sm text-moss font-medium shrink-0">Conectado ✓</span>
          ) : (
            <button onClick={() => startOpenRouterConnect()} className="btn btn-petrol shrink-0">
              Conectar
            </button>
          )}
        </div>
      </div>

      {/* Manual keys */}
      <div className="card-pad space-y-5">
        {KEY_PROVIDERS.map((p) => (
          <div key={p.id}>
            <label className="label flex items-center gap-2">
              {p.label}
              {ok(p.id) && <span className="text-xs text-moss font-medium">conectado ✓</span>}
            </label>
            <div className="flex gap-2">
              <input type="password" className="input" value={keys[p.id] || ''}
                onChange={(e) => setKeys((k) => ({ ...k, [p.id]: e.target.value }))}
                placeholder={p.placeholder} />
              <button onClick={() => saveKey(p.id)} className="btn btn-primary shrink-0">Salvar</button>
            </div>
          </div>
        ))}

        <div>
          <label className="label flex items-center gap-2">
            Ollama (local)
            {ok('ollama') && <span className="text-xs text-moss font-medium">conectado ✓</span>}
          </label>
          <div className="flex gap-2">
            <input type="text" className="input" value={ollama}
              onChange={(e) => setOllama(e.target.value)} placeholder="http://localhost:11434" />
            <button onClick={saveOllama} className="btn btn-primary shrink-0">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
