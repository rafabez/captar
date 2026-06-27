import { Link } from 'react-router-dom'
import { SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import hero from '../assets/hero.png'

const STEPS = [
  { n: '01', t: 'Conte sobre seu projeto', d: 'Responda perguntas simples sobre sua ideia cultural.' },
  { n: '02', t: 'Receba seu diagnóstico', d: 'Em menos de 1 minuto: score, pontos fortes, gargalos e editais compatíveis.' },
  { n: '03', t: 'Construa e exporte', d: 'Gere cada seção com IA. Edite, refine e exporte pronto para submissão.' },
]

const DIFFS = [
  { t: 'Você controla sua IA', d: 'Conecte sua chave da OpenAI, Claude ou Gemini — ou rode local com Ollama. O CAPTAR não cobra tokens.' },
  { t: 'Projeto Score', d: 'Nota de maturidade por dimensão: conceito, narrativa, orçamento, equipe, contrapartidas, acessibilidade.' },
  { t: 'Adapte para qualquer edital', d: 'Um projeto, múltiplas versões. Lei Rouanet, ProAC, edital municipal ou patrocinador.' },
  { t: 'Feito para o Brasil', d: 'Leis, rubricas, formulários e editais estaduais e municipais. Da inscrição à prestação de contas.' },
]

const PLANS = [
  { name: 'Free', price: 'Grátis', feat: '1 projeto · 1 diagnóstico · export com marca d’água', accent: false },
  { name: 'Individual', price: 'R$ 29,90', feat: '5 projetos · diagnósticos ilimitados · 10 editais/mês', accent: true },
  { name: 'Profissional', price: 'R$ 79,90', feat: 'Orçamento, cronograma, match, versionamento · 20 projetos', accent: false },
  { name: 'Studio', price: 'R$ 199,90', feat: 'Ilimitado · multiusuário · CRM · radar · white-label', accent: false },
]

function Cta({ className = '' }: { className?: string }) {
  return (
    <>
      <SignedOut>
        <SignUpButton mode="modal">
          <button className={`btn btn-primary ${className}`}>Criar meu primeiro projeto</button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <Link to="/dashboard" className={`btn btn-primary ${className}`}>Ir para meus projetos</Link>
      </SignedIn>
    </>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper bg-grain">
      {/* Top bar */}
      <header className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold text-ink">CAPTAR</span>
          <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
        </div>
        <div className="flex items-center gap-3">
          <Link to="/sign-in" className="text-sm text-ink-soft hover:text-ink">Entrar</Link>
          <Cta />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="eyebrow mb-4">Do rascunho ao recurso</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-ink leading-[1.05]">
            Tire seu projeto cultural do{' '}
            <span className="text-terracotta italic">rascunho</span>.
          </h1>
          <p className="text-lg text-ink-soft mt-6 max-w-md">
            Plataforma para artistas e produtores culturais criarem,
            diagnosticarem e exportarem projetos para Lei Rouanet, ProAC,
            editais e patrocínios.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Cta />
            <Link to="/sign-in" className="btn btn-ghost">Fazer diagnóstico grátis</Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-3 rounded-3xl bg-terracotta/10 -rotate-2" />
          <img
            src={hero}
            alt="Projeto cultural"
            className="relative rounded-3xl border border-line shadow-xl w-full object-cover aspect-[4/3]"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-paper-2 border-y border-line">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl font-bold text-ink mb-12">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="font-display text-4xl text-terracotta/40 mb-3">{s.n}</div>
                <h3 className="text-lg font-semibold text-ink mb-2">{s.t}</h3>
                <p className="text-sm text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="eyebrow mb-3">Diferenciais</p>
        <h2 className="font-display text-3xl font-bold text-ink mb-10 max-w-lg">
          Não é um chatbot — é uma ferramenta de trabalho.
        </h2>
        <div className="grid md:grid-cols-2 gap-px bg-line rounded-2xl overflow-hidden border border-line">
          {DIFFS.map((d) => (
            <div key={d.t} className="bg-card p-8">
              <h3 className="text-lg font-semibold text-ink mb-2">{d.t}</h3>
              <p className="text-sm text-ink-soft">{d.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-ink text-paper">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl font-bold mb-2">Planos</h2>
          <p className="text-paper/50 mb-10 text-sm">
            Você traz sua chave de IA. O CAPTAR não cobra tokens.
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 border ${
                  p.accent ? 'bg-terracotta border-terracotta' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="text-sm font-medium opacity-70">{p.name}</div>
                <div className="font-display text-2xl font-bold mt-1">{p.price}</div>
                <p className="text-xs opacity-70 mt-3 leading-relaxed">{p.feat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-sm text-ink-soft flex justify-between">
        <span>CAPTAR — do rascunho ao recurso.</span>
        <span>© 2026 · captar.ia.br</span>
      </footer>
    </div>
  )
}
