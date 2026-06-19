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

const KEY_PROVIDERS: { id: string; label: string; placeholder: string }[] = [
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic Claude', placeholder: 'sk-ant-...' },
  { id: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
]

export default function Settings() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [ollama, setOllama] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const connected = (id: string) =>
    providers.find((p) => p.provider === id && p.is_active)

  async function load() {
    try {
      setProviders(await api.get<Provider[]>('/user/providers'))
    } catch {
      /* not configured yet */
    }
  }

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
    setStatus(null)
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
    const endpoint_url = ollama.trim() || 'http://localhost:11434'
    try {
      await api.post('/user/providers', { provider: 'ollama', endpoint_url })
      setStatus('Ollama salvo!')
      await load()
    } catch (e) {
      setStatus(`Erro: ${(e as Error).message}`)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-8">Configurações</h1>

      <div className="bg-white border border-sand rounded-xl p-8 max-w-lg">
        <h2 className="text-lg font-semibold text-ink mb-4">Conexão com IA</h2>
        <p className="text-sm text-ink/40 mb-6">
          Conecte sua própria IA. O CAPTAR não cobra tokens — você paga direto ao
          seu provedor (ou roda local, de graça, com Ollama).
        </p>

        {status && (
          <div className="mb-4 text-sm text-terracotta">{status}</div>
        )}

        {/* OpenRouter — 1-click, recommended */}
        <div className="mb-6 p-4 border border-sand rounded-lg bg-paper">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-ink">OpenRouter (recomendado)</div>
              <div className="text-xs text-ink/40">
                Conecte com 1 clique — acesso a OpenAI, Claude, Gemini e mais.
              </div>
            </div>
            {connected('openrouter') ? (
              <span className="text-xs text-petroleum font-medium">Conectado ✓</span>
            ) : (
              <button
                onClick={() => startOpenRouterConnect()}
                className="bg-petroleum text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Conectar
              </button>
            )}
          </div>
        </div>

        {/* Manual keys */}
        <div className="space-y-4">
          {KEY_PROVIDERS.map((p) => (
            <div key={p.id}>
              <label className="block text-sm font-medium text-ink mb-1">
                {p.label}
                {connected(p.id)?.has_key && (
                  <span className="ml-2 text-xs text-petroleum">conectado ✓</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={keys[p.id] || ''}
                  onChange={(e) => setKeys((k) => ({ ...k, [p.id]: e.target.value }))}
                  placeholder={p.placeholder}
                  className="flex-1 px-4 py-2 border border-sand rounded-lg bg-white text-ink text-sm placeholder:text-ink/20 focus:outline-none focus:border-terracotta"
                />
                <button
                  onClick={() => saveKey(p.id)}
                  className="bg-terracotta text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Salvar
                </button>
              </div>
            </div>
          ))}

          {/* Ollama — local, no key */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Ollama (local)
              {connected('ollama') && (
                <span className="ml-2 text-xs text-petroleum">conectado ✓</span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ollama}
                onChange={(e) => setOllama(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 px-4 py-2 border border-sand rounded-lg bg-white text-ink text-sm placeholder:text-ink/20 focus:outline-none focus:border-terracotta"
              />
              <button
                onClick={saveOllama}
                className="bg-terracotta text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
