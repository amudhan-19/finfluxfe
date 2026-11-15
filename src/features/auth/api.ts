// @author  veera
// @file    features/auth/api.ts

import api from '@/api/client'
import type { UserMe } from '@/types/models'

export interface LoginPayload { email: string; password: string }
export interface LoginResponse { access_token: string; token_type: 'bearer'; user: UserMe }

export async function login(body: LoginPayload): Promise<LoginResponse> {
  const r = await api.post<LoginResponse>('/api/auth/login', body)
  return r.data
}

export async function refresh(): Promise<LoginResponse> {
  const r = await api.post<LoginResponse>('/api/auth/refresh', {})
  return r.data
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout', {})
}

export async function fetchMe(): Promise<UserMe> {
  const r = await api.get<UserMe>('/api/auth/me')
  return r.data
}

export async function acceptInvite(body: { token: string; password: string }): Promise<LoginResponse> {
  const r = await api.post<LoginResponse>('/api/auth/accept-invite', body)
  return r.data
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/api/auth/forgot-password', { email })
}

export async function resetPassword(body: { token: string; password: string }): Promise<void> {
  await api.post('/api/auth/reset-password', body)
}
