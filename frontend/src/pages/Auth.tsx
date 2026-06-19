import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      await api.post(endpoint, { email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar')
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">CAPTAR</h1>
          <p className="text-ink/50">do rascunho ao recurso</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-sand rounded-lg bg-white text-ink placeholder:text-ink/30 focus:outline-none focus:border-terracotta transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-sand rounded-lg bg-white text-ink placeholder:text-ink/30 focus:outline-none focus:border-terracotta transition-colors"
            required
          />

          {error && (
            <p className="text-terracotta text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-terracotta text-white py-3 rounded-lg font-medium hover:bg-terracotta/90 transition-colors"
          >
            {isRegister ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-ink/40 mt-6">
          {isRegister ? 'Já tem conta?' : 'Não tem conta?'}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="text-terracotta hover:underline"
          >
            {isRegister ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
      </div>
    </div>
  )
}
