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
  { id: 'deepseek', label: 'DeepSeek', placeholder: 'sk-...' },
]

export default function Settings() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [ollama, setOllama] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const connected = (id: string) => providers.find((p) => p.provider === id && p.is_active)
  const ok = (id: string) => !!connected(id) && (id === 'ollama' || !!connected(id)?.has_key)

  const load = () => api.get<Provider[]>('/user/providers').then(setProviders).catch(() => {})
  const loadProfile = () =>
    api.get<{ active_provider: string | null }>('/user/profile')
      .then((p) => setActive(p.active_provider)).catch(() => {})

  useEffect(() => {
    completeOpenRouterConnect()
      .then((okConn) => {
        if (okConn) setStatus('OpenRouter conectado!')
        return Promise.all([load(), loadProfile()])
      })
      .catch((e) => setStatus(`Erro: ${e.message}`))
  }, [])

  async function saveKey(id: string) {
    const api_key = keys[id]?.trim()
    if (!api_key) return
    try {
      await api.post('/user/providers', { provider: id, api_key })
      setKeys((k) => ({ ...k, [id]: '' }))
      setStatus(`${id} salvo e em uso!`)
      await Promise.all([load(), loadProfile()])
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
      setStatus('Ollama salvo e em uso!')
      await Promise.all([load(), loadProfile()])
    } catch (e) {
      setStatus(`Erro: ${(e as Error).message}`)
    }
  }

  async function selectProvider(id: string) {
    try {
      await api.post('/user/providers/select', { provider: id })
      setActive(id)
      setStatus(`Usando ${id} para a IA.`)
    } catch (e) {
      setStatus(`Erro: ${(e as Error).message}`)
    }
  }

  // Status pill: "Em uso" badge, or a "Usar" switch button for connected-but-idle.
  function Pill({ id }: { id: string }) {
    if (!ok(id)) return null
    if (active === id)
      return <span className="text-xs text-terracotta font-semibold shrink-0">● Em uso</span>
    return (
      <button onClick={() => selectProvider(id)} className="text-xs text-petroleum underline shrink-0">
        Usar esta
      </button>
    )
  }

  return (
    <div className="max-w-xl">
      <p className="eyebrow mb-1">Configurações</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Conexão com IA</h1>
      <p className="text-sm text-ink-soft mb-2">
        Conecte sua própria IA. O CAPTAR não cobra tokens — você paga direto ao
        seu provedor, ou roda local de graça com Ollama.
      </p>
      <p className="text-sm text-ink-soft mb-8">
        Pode conectar várias, mas só <strong className="text-ink">uma</strong> é usada por vez —
        a marcada <span className="text-terracotta font-semibold">● Em uso</span>. Clique
        “Usar esta” para trocar.
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
            <Pill id="openrouter" />
          ) : (
            <button onClick={() => startOpenRouterConnect()} className="btn btn-petrol shrink-0">
              Conectar
            </button>
          )}
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-petroleum">Como conectar (passo a passo)</summary>
          <ol className="list-decimal ml-5 mt-2 space-y-1 text-ink-soft">
            <li>Clique em <strong className="text-ink">Conectar</strong> acima.</li>
            <li>Faça login ou crie uma conta grátis no OpenRouter.</li>
            <li>Autorize o CAPTAR a usar sua conta.</li>
            <li>Você volta para cá já conectado — vai aparecer "Em uso".</li>
            <li>Para modelos pagos, adicione créditos em openrouter.ai (a partir de US$5). Vários modelos têm opção grátis.</li>
          </ol>
        </details>
      </div>

      {/* Manual keys */}
      <div className="card-pad space-y-5">
        {KEY_PROVIDERS.map((p) => (
          <div key={p.id}>
            <label className="label flex items-center justify-between">
              <span>{p.label}</span>
              <Pill id={p.id} />
            </label>
            <div className="flex gap-2">
              <input type="password" className="input" value={keys[p.id] || ''}
                onChange={(e) => setKeys((k) => ({ ...k, [p.id]: e.target.value }))}
                placeholder={ok(p.id) ? '•••••••• (substituir)' : p.placeholder} />
              <button onClick={() => saveKey(p.id)} className="btn btn-primary shrink-0">Salvar</button>
            </div>
          </div>
        ))}

        <div>
          <label className="label flex items-center justify-between">
            <span>Ollama (local)</span>
            <Pill id="ollama" />
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
