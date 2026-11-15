// @author  veera
// @file    pages/auth/AcceptInvitePage.tsx

import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { homeRoute } from '@/utils/rbac'
import * as authApi from '@/features/auth/api'
import { U } from '@/constants/uiText'

export default function AcceptInvitePage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const { applyAccess } = useAuth()

  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (!token) setErr('Missing invite token') }, [token])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (pw1.length < 8) return setErr('Password must be at least 8 characters')
    if (pw1 !== pw2) return setErr('Passwords do not match')
    setSubmitting(true)
    setErr(null)
    try {
      const r = await authApi.acceptInvite({ token, password: pw1 })
      applyAccess(r.access_token, r.user)
      navigate(homeRoute(r.user.role), { replace: true })
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Could not accept invite')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container title="Set your password">
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="New password">
          <input type="password" required value={pw1} onChange={(e) => setPw1(e.target.value)} style={inputS} />
        </Field>
        <Field label="Confirm">
          <input type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)} style={inputS} />
        </Field>
        {err && <Err>{err}</Err>}
        <button type="submit" disabled={submitting || !token} style={btnS(submitting || !token)}>
          {submitting ? `Saving${U.ellip}` : 'Activate account'}
        </button>
      </form>
    </Container>
  )
}


// Shared mini-components used by other auth pages too
export function Container({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center',
                  background: 'linear-gradient(135deg,#f5f6f8 0%,#e2e8f0 100%)' }}>
      <div style={{ width: 380, padding: '32px 36px', background: 'var(--x-card)',
                    borderRadius: 14, boxShadow: '0 12px 40px rgba(15,23,42,.08)',
                    border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 18 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{label}</span>
      {children}
    </label>
  )
}

export function Err({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 10px', background: '#fee2e2', color: '#991b1b',
                  borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{children}</div>
  )
}

export const inputS: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb',
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
}

export const btnS = (disabled?: boolean): React.CSSProperties => ({
  marginTop: 4, padding: '10px 14px',
  background: disabled ? '#94a3b8' : '#16a34a', color: '#fff',
  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
  cursor: disabled ? 'not-allowed' : 'pointer',
})
