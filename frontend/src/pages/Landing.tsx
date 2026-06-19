import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-5xl font-bold text-ink mb-6 leading-tight">
          Tire seu projeto cultural do rascunho.
        </h1>
        <p className="text-xl text-ink/60 max-w-2xl mx-auto mb-10">
          O CAPTAR é a plataforma de IA para artistas e produtores culturais
          criarem, diagnosticarem e exportarem projetos para Lei Rouanet,
          ProAC, editais e patrocínios.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/auth"
            className="bg-terracotta text-white px-8 py-3 rounded-lg font-medium hover:bg-terracotta/90 transition-colors"
          >
            Criar meu primeiro projeto
          </Link>
          <Link
            to="/auth"
            className="border border-sand text-ink px-8 py-3 rounded-lg font-medium hover:bg-sand/30 transition-colors"
          >
            Fazer diagnóstico grátis
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-3 gap-8">
        <div className="bg-white border border-sand rounded-xl p-8">
          <div className="text-2xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-ink mb-2">Diagnóstico em minutos</h3>
          <p className="text-ink/60 text-sm">
            Responda 8 perguntas e receba score de maturidade, pontos fortes,
            fragilidades e editais compatíveis.
          </p>
        </div>
        <div className="bg-white border border-sand rounded-xl p-8">
          <div className="text-2xl mb-3">📄</div>
          <h3 className="text-lg font-semibold text-ink mb-2">Edital explicado</h3>
          <p className="text-ink/60 text-sm">
            Suba o PDF e receba resumo, requisitos, checklist e match
            automático com seus projetos.
          </p>
        </div>
        <div className="bg-white border border-sand rounded-xl p-8">
          <div className="text-2xl mb-3">📑</div>
          <h3 className="text-lg font-semibold text-ink mb-2">Projeto pronto para exportar</h3>
          <p className="text-ink/60 text-sm">
            Gere justificativa, objetivos, orçamento com IA. Exporte em
            DOCX ou PDF e adapte para diferentes editais.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand py-8 text-center text-sm text-ink/40">
        CAPTAR — do rascunho ao recurso. © 2026
      </footer>
    </div>
  )
}
