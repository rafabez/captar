export default function Settings() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-8">Configurações</h1>

      <div className="bg-white border border-sand rounded-xl p-8 max-w-lg">
        <h2 className="text-lg font-semibold text-ink mb-4">Conexão com IA</h2>
        <p className="text-sm text-ink/40 mb-6">
          Conecte sua própria chave de API. O CAPTAR não cobra tokens —
          você paga direto ao seu provedor.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">OpenAI</label>
            <input
              type="password"
              placeholder="sk-..."
              className="w-full px-4 py-2 border border-sand rounded-lg bg-white text-ink text-sm placeholder:text-ink/20 focus:outline-none focus:border-terracotta"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Anthropic Claude</label>
            <input
              type="password"
              placeholder="sk-ant-..."
              className="w-full px-4 py-2 border border-sand rounded-lg bg-white text-ink text-sm placeholder:text-ink/20 focus:outline-none focus:border-terracotta"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">OpenRouter</label>
            <input
              type="password"
              placeholder="sk-or-..."
              className="w-full px-4 py-2 border border-sand rounded-lg bg-white text-ink text-sm placeholder:text-ink/20 focus:outline-none focus:border-terracotta"
            />
          </div>
        </div>

        <button className="mt-6 bg-terracotta text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-terracotta/90 transition-colors">
          Salvar
        </button>
      </div>
    </div>
  )
}
