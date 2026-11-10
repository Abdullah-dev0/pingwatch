import { API_URL } from './constants'

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${response.status})`)
  }
  return body as T
}
