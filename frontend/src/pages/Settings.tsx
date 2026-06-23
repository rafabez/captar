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

type Kind = 'oauth' | 'key' | 'endpoint'
const PROVIDERS: { id: string; label: string; kind: Kind; placeholder?: string; desc?: string; recommended?: boolean }[] = [
  { id: 'openrouter', label: 'OpenRouter', kind: 'oauth', recommended: true, desc: '1 clique — acesso a OpenAI, Claude, Gemini e mais.' },
  { id: 'openai', label: 'OpenAI', kind: 'key', placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic Claude', kind: 'key', placeholder: 'sk-ant-...' },
  { id: 'gemini', label: 'Google Gemini', kind: 'key', placeholder: 'AIza...' },
  { id: 'deepseek', label: 'DeepSeek', kind: 'key', placeholder: 'sk-...' },
  { id: 'ollama', label: 'Ollama (local)', kind: 'endpoint', placeholder: 'http://localhost:11434', desc: 'Rode modelos locais, de graça.' },
]

function Radio({ active, disabled }: { active: boolean; disabled: boolean }) {
  return (
    <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
      active ? 'border-terracotta' : 'border-sand'} ${disabled ? 'opacity-30' : ''}`}>
      {active && <span className="h-2.5 w-2.5 rounded-full bg-terracotta" />}
    </span>
  )
}

export default function Settings() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string | null>(null)

  const found = (id: string) => providers.find((p) => p.provider === id && p.is_active)
  const connected = (id: string) => !!found(id) && (id === 'ollama' || !!found(id)?.has_key)

  const load = () => api.get<Provider[]>('/user/providers').then(setProviders).catch(() => {})
  const loadProfile = () =>
    api.get<{ active_provider: string | null }>('/user/profile').then((p) => setActive(p.active_provider)).catch(() => {})

  useEffect(() => {
    completeOpenRouterConnect()
      .then((ok) => {
        if (ok) setStatus('OpenRouter conectado!')
        return Promise.all([load(), loadProfile()])
      })
      .catch((e) => setStatus(`Erro: ${e.message}`))
  }, [])

  async function save(id: string, kind: Kind) {
    const val = inputs[id]?.trim()
    try {
      if (kind === 'endpoint') {
        await api.post('/user/providers', { provider: id, endpoint_url: val || 'http://localhost:11434' })
      } else {
        if (!val) return
        await api.post('/user/providers', { provider: id, api_key: val })
      }
      setInputs((k) => ({ ...k, [id]: '' }))
      setStatus(`${id} salvo e selecionado.`)
      await Promise.all([load(), loadProfile()])
    } catch (e) { setStatus(`Erro: ${(e as Error).message}`) }
  }

  async function select(id: string) {
    if (!connected(id) || active === id) return
    try {
      await api.post('/user/providers/select', { provider: id })
      setActive(id)
      setStatus(`Usando ${id} para a IA.`)
    } catch (e) { setStatus(`Erro: ${(e as Error).message}`) }
  }

  return (
    <div className="max-w-2xl">
      <p className="eyebrow mb-1">Configurações</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Conexão com IA</h1>
      <p className="text-sm text-ink-soft mb-6">
        Conecte um ou mais provedores e selecione qual usar (o marcado é o ativo).
        O CAPTAR não cobra tokens — você paga direto ao seu provedor, ou roda local com Ollama.
      </p>

      {status && (
        <div className="rounded-xl bg-moss/10 border border-moss/20 text-moss text-sm px-4 py-2.5 mb-6">{status}</div>
      )}

      <div className="space-y-3">
        {PROVIDERS.map((p) => {
          const isConn = connected(p.id)
          const isActive = active === p.id
          return (
            <div key={p.id}
              onClick={() => select(p.id)}
              className={`card p-5 transition-all ${isConn ? 'cursor-pointer' : ''} ${
                isActive ? 'border-terracotta ring-2 ring-terracotta/15' : 'border-line hover:border-sand'}`}>
              <div className="flex items-center gap-3">
                <Radio active={isActive} disabled={!isConn} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{p.label}</span>
                    {p.recommended && <span className="chip">recomendado</span>}
                  </div>
                  {p.desc && <p className="text-xs text-ink-soft mt-0.5">{p.desc}</p>}
                </div>
                <div className="shrink-0 text-xs font-medium">
                  {isActive ? <span className="text-terracotta">● Em uso</span>
                    : isConn ? <span className="text-moss">Conectado</span>
                    : <span className="text-ink-soft/60">Não conectado</span>}
                </div>
              </div>

              {/* connect control — clicks here don't select the card */}
              <div className="mt-3 pl-8" onClick={(e) => e.stopPropagation()}>
                {p.kind === 'oauth' ? (
                  isConn ? (
                    <button onClick={() => startOpenRouterConnect()} className="text-xs text-petroleum hover:underline">Reconectar</button>
                  ) : (
                    <button onClick={() => startOpenRouterConnect()} className="btn btn-petrol">Conectar</button>
                  )
                ) : (
                  <div className="flex gap-2">
                    <input
                      type={p.kind === 'key' ? 'password' : 'text'}
                      className="input"
                      value={inputs[p.id] || ''}
                      onChange={(e) => setInputs((k) => ({ ...k, [p.id]: e.target.value }))}
                      placeholder={isConn && p.kind === 'key' ? '•••••••• (substituir)' : p.placeholder}
                    />
                    <button onClick={() => save(p.id, p.kind)} className="btn btn-primary shrink-0">
                      {isConn ? 'Atualizar' : 'Salvar'}
                    </button>
                  </div>
                )}

                {p.id === 'openrouter' && !isConn && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer text-petroleum">Como conectar (passo a passo)</summary>
                    <ol className="list-decimal ml-5 mt-2 space-y-1 text-ink-soft">
                      <li>Clique em <strong className="text-ink">Conectar</strong>.</li>
                      <li>Faça login ou crie conta grátis no OpenRouter.</li>
                      <li>Autorize o CAPTAR.</li>
                      <li>Você volta já conectado (aparece "Em uso").</li>
                      <li>Para modelos pagos, adicione créditos em openrouter.ai (a partir de US$5). Vários têm opção grátis.</li>
                    </ol>
                  </details>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
