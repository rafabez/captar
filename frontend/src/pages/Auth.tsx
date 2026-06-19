import { SignIn, SignUp } from '@clerk/clerk-react'
import { Link, useLocation } from 'react-router-dom'

export default function Auth() {
  const isSignUp = useLocation().pathname.startsWith('/sign-up')

  return (
    <div className="min-h-screen bg-paper bg-grain flex flex-col items-center justify-center px-6 py-12">
      <Link to="/" className="text-center mb-8">
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="font-display text-3xl font-bold text-ink">CAPTAR</span>
          <span className="h-2 w-2 rounded-full bg-terracotta" />
        </div>
        <p className="text-ink-soft text-sm mt-1 italic">do rascunho ao recurso</p>
      </Link>

      {isSignUp ? (
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" afterSignUpUrl="/dashboard" />
      ) : (
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" afterSignInUrl="/dashboard" />
      )}
    </div>
  )
}
