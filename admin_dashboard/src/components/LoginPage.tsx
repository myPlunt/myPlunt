import { useState, type FormEvent } from 'react'

import logoMyPlunt from '../assets/logo-myplunt.svg'
import { useAuth } from '../auth/auth-context'
import { ApiError } from '../lib/api'
import StagingPill from './StagingPill'

function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Can't reach the server. Please try again.")
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8 rounded-3xl bg-cream p-8 shadow-card">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src={logoMyPlunt} alt="" width={42} height={44} />
          <h1 className="font-primary text-[44px] leading-none font-semibold text-green">myPlunt Admin</h1>
          <StagingPill />
          <p className="text-[15px] text-ink">Log in with your admin account.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-semibold text-green">
            Email
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl border border-sand bg-white px-4 py-3 text-base font-normal text-charcoal outline-none focus:border-leaf"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-green">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl border border-sand bg-white px-4 py-3 text-base font-normal text-charcoal outline-none focus:border-leaf"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm font-semibold text-soil">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-green px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default LoginPage
