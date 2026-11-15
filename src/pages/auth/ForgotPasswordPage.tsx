// @author  veera
// @file    pages/auth/ForgotPasswordPage.tsx

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import * as authApi from '@/features/auth/api'
import { Container, Field, Err, inputS, btnS } from './AcceptInvitePage'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErr(null)
    try {
      await authApi.forgotPassword(email.trim().toLowerCase())
      setDone(true)
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Failed to send reset email')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Container title="Check your email">
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
          If an account exists for <b>{email}</b> we sent a reset link.
        </p>
        <Link to="/login" style={{ display: 'inline-block', marginTop: 16, color: '#2563eb', fontWeight: 600 }}>
          ← Back to sign in
        </Link>
      </Container>
    )
  }

  return (
    <Container title="Reset password">
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Email">
          <input type="email" required autoFocus value={email}
                 onChange={(e) => setEmail(e.target.value)} style={inputS} />
        </Field>
        {err && <Err>{err}</Err>}
        <button type="submit" disabled={submitting} style={btnS(submitting)}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
        <Link to="/login" style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>← Back to sign in</Link>
      </form>
    </Container>
  )
}
