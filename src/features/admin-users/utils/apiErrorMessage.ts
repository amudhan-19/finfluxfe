// @author  veera
// @file    features/admin-users/utils/apiErrorMessage.ts

/** Axios-style error body from FastAPI */
interface ApiErrorPayload {
  response?: { data?: { detail?: string | { msg?: string }[] } }
}

function detailToString(detail: string | { msg?: string }[] | undefined): string | undefined {
  if (detail == null) return undefined
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const parts = detail.map((x) => x?.msg).filter(Boolean)
    return parts.length ? parts.join('; ') : undefined
  }
  return undefined
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const d = (error as ApiErrorPayload)?.response?.data?.detail
  const s = detailToString(d)
  return s && s.trim() ? s : fallback
}
