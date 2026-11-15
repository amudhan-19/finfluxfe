// @author  veera
// @file    features/admin-branding/api.ts

import api from '@/api/client'
import type { Branding } from '@/types/models'

export async function getBranding(): Promise<Branding> {
  const r = await api.get<Branding>('/api/admin/branding')
  return r.data
}

export async function uploadLogo(file: File): Promise<Branding> {
  const fd = new FormData()
  fd.append('file', file)
  const r = await api.post<Branding>('/api/admin/branding/logo', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return r.data
}

export async function setPrimaryColor(color: string): Promise<Branding> {
  const r = await api.put<Branding>('/api/admin/branding', null, { params: { primary_color: color } })
  return r.data
}
