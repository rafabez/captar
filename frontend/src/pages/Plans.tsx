export default function Plans() {
  const plans = [
    { name: 'FREE', price: 'Grátis', features: ['1 projeto', '1 diagnóstico', 'Export com marca d\'água'] },
    { name: 'INDIVIDUAL', price: 'R$ 29,90', features: ['5 projetos', 'Diagnósticos ilimitados', 'Export limpa', '10 uploads/mês'] },
    { name: 'PROFISSIONAL', price: 'R$ 79,90', features: ['20 projetos', 'Orçamento inteligente', 'Cronograma', 'Match com editais'] },
    { name: 'STUDIO', price: 'R$ 199,90', features: ['Projetos ilimitados', 'Multiusuário', 'CRM de patrocinadores', 'White-label'] },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-2">Planos</h1>
      <p className="text-ink/40 mb-8">Você traz sua chave de IA. CAPTAR não cobra tokens.</p>

      <div className="grid grid-cols-4 gap-4">
        {plans.map((p) => (
          <div key={p.name} className="bg-white border border-sand rounded-xl p-6">
            <div className="text-xs font-bold text-ochre uppercase tracking-wider mb-1">{p.name}</div>
            <div className="text-2xl font-bold text-ink mb-4">{p.price}<span className="text-sm font-normal text-ink/30">/mês</span></div>
            <ul className="space-y-2 mb-6">
              {p.features.map((f) => (
                <li key={f} className="text-sm text-ink/60">✓ {f}</li>
              ))}
            </ul>
            <button className="w-full bg-terracotta text-white py-2 rounded-lg text-sm font-medium hover:bg-terracotta/90 transition-colors">
              Assinar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
