const PLANS = [
  { name: 'Free', price: 'Grátis', feat: ['1 projeto', '1 diagnóstico', 'Export com marca d’água'], accent: false },
  { name: 'Individual', price: 'R$ 29,90/mês', feat: ['5 projetos', 'Diagnósticos ilimitados', '10 editais/mês', 'Export limpa'], accent: true },
  { name: 'Profissional', price: 'R$ 79,90/mês', feat: ['20 projetos', 'Orçamento + cronograma', 'Match com editais', 'Versionamento'], accent: false },
  { name: 'Studio', price: 'R$ 199,90/mês', feat: ['Projetos ilimitados', 'Multiusuário', 'CRM de patrocinadores', 'White-label'], accent: false },
]

export default function Plans() {
  return (
    <div>
      <p className="eyebrow mb-1">Planos</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Escolha seu plano</h1>
      <p className="text-sm text-ink-soft mb-8">
        Você traz sua chave de IA. O CAPTAR não cobra tokens.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((p) => (
          <div key={p.name}
            className={`rounded-2xl p-6 border ${
              p.accent ? 'border-terracotta ring-2 ring-terracotta/15 bg-card' : 'card'
            }`}>
            <div className="text-sm font-medium text-ink-soft">{p.name}</div>
            <div className="font-display text-2xl font-bold text-ink mt-1">{p.price}</div>
            <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
              {p.feat.map((f) => (
                <li key={f} className="flex gap-2"><span className="text-terracotta">•</span>{f}</li>
              ))}
            </ul>
            <button className={`btn w-full mt-6 ${p.accent ? 'btn-primary' : 'btn-ghost'}`}>
              {p.name === 'Free' ? 'Plano atual' : 'Em breve'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
