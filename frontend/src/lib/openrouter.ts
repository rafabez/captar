// OpenRouter OAuth (PKCE) — connect an AI provider in the browser, no key paste.
// Flow: startConnect() redirects to OpenRouter -> user authorizes -> OpenRouter
// redirects back with ?code= -> completeConnect() posts code+verifier to our
// backend, which exchanges it for a key and stores it encrypted.
import { api } from './api'

const VERIFIER_KEY = 'or_pkce_verifier'

function base64url(bytes: Uint8Array): string {
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(): string {
  const bytes = new Uint8Array(48)
  crypto.getRandomValues(bytes)
  return base64url(bytes)
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64url(new Uint8Array(digest))
}

export async function startOpenRouterConnect(): Promise<void> {
  const verifier = randomVerifier()
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  const challenge = await challengeFor(verifier)
  const callback = `${window.location.origin}/settings`
  const url =
    `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callback)}` +
    `&code_challenge=${challenge}&code_challenge_method=S256`
  window.location.href = url
}

// Call on /settings mount. Returns true if a code was present and exchanged.
export async function completeOpenRouterConnect(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code) return false

  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  // Strip the code from the URL regardless, so a refresh doesn't re-trigger.
  window.history.replaceState({}, '', window.location.pathname)
  if (!verifier) return false

  await api.post('/user/providers/openrouter/exchange', { code, code_verifier: verifier })
  sessionStorage.removeItem(VERIFIER_KEY)
  return true
}
