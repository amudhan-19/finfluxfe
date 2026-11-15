// @author  veera
// @file    api/client.ts

import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

let _accessToken: string | null = null
let _onUnauthorized: (() => void) | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

export function onUnauthorized(handler: () => void) {
  _onUnauthorized = handler
}

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${_accessToken}`
  }
  return config
})

let _refreshPromise: Promise<string | null> | null = null

async function refreshOnce(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = axios
      .post<{ access_token: string }>(`${baseURL}/api/auth/refresh`, {}, { withCredentials: true })
      .then((r) => {
        _accessToken = r.data.access_token
        return _accessToken
      })
      .catch(() => null)
      .finally(() => {
        _refreshPromise = null
      })
  }
  return _refreshPromise
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined
    if (
      err.response?.status === 401 &&
      original &&
      !original._retried &&
      !(original.url || '').includes('/api/auth/')
    ) {
      original._retried = true
      const token = await refreshOnce()
      if (token) {
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` }
        return api.request(original)
      }
      _accessToken = null
      _onUnauthorized?.()
    }
    return Promise.reject(err)
  },
)

export default api
