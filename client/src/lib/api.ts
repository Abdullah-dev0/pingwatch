// set VITE_API_URL for production builds
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${response.status})`)
  }
  return body as T
}
