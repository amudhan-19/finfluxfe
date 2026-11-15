// @author  veera
// @file    pages/auth/ResetPasswordPage.tsx

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import * as authApi from '@/features/auth/api'
import { Container, Field, Err, inputS, btnS } from './AcceptInvitePage'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()

  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { if (!token) setErr('Missing reset token') }, [token])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (pw1.length < 8) return setErr('Password must be at least 8 characters')
    if (pw1 !== pw2) return setErr('Passwords do not match')
    setSubmitting(true)
    setErr(null)
    try {
      await authApi.resetPassword({ token, password: pw1 })
      navigate('/login?reset=ok', { replace: true })
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container title="Reset password">
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="New password">
          <input type="password" required value={pw1} onChange={(e) => setPw1(e.target.value)} style={inputS} />
        </Field>
        <Field label="Confirm">
          <input type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)} style={inputS} />
        </Field>
        {err && <Err>{err}</Err>}
        <button type="submit" disabled={submitting || !token} style={btnS(submitting || !token)}>
          {submitting ? 'Saving…' : 'Set new password'}
        </button>
        <Link to="/login" style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>← Back to sign in</Link>
      </form>
    </Container>
  )
}
