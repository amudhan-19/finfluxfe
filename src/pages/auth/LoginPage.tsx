// @author  veera
// @file    pages/auth/LoginPage.tsx

import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { homeRoute } from '@/utils/rbac'
import { U } from '@/constants/uiText'
import logoDark from '@/assets/images/logo-dark.svg'

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation() as { state?: { from?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { setErr(null) }, [email, password])

  if (loading) return null
  if (user) return <Navigate to={loc.state?.from || homeRoute(user.role)} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErr(null)
    try {
      const me = await signIn(email.trim().toLowerCase(), password)
      navigate(loc.state?.from || homeRoute(me.role), { replace: true })
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-login">
      <div className="auth-login__card">
        <div className="auth-login__brand">
          <img
            src={logoDark}
            alt="FinFlux"
            className="auth-login__logo"
          />
          <p className="auth-login__tagline">
            {`FinFlux ${U.mid} Flux Analysis Module`}
          </p>
        </div>

        <form className="auth-login__form" onSubmit={onSubmit}>
          <label className="auth-login__field">
            <span className="auth-login__label">Email</span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-login__input"
            />
          </label>

          <label className="auth-login__field">
            <span className="auth-login__label">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={'\u2022'.repeat(8)}
              className="auth-login__input"
            />
          </label>

          {err ? <div className="auth-login__error" role="alert">{err}</div> : null}

          <button type="submit" disabled={submitting} className="auth-login__submit">
            {submitting ? `Signing in${U.ellip}` : 'Sign in'}
          </button>

          <div className="auth-login__footer">
            <Link to="/forgot-password" className="auth-login__link">
              Forgot password?
            </Link>
            <span className="auth-login__version">v2.0</span>
          </div>
        </form>
      </div>
    </div>
  )
}
