import { SignIn, SignUp } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'

export default function Auth() {
  const location = useLocation()
  const isSignUp = location.pathname === '/sign-up'

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">CAPTAR</h1>
          <p className="text-ink/50">do rascunho ao recurso</p>
        </div>
        {isSignUp ? (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
          />
        ) : (
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
          />
        )}
      </div>
    </div>
  )
}
