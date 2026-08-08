const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: options.credentials ?? 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return response.json()
}

// Admin routes need the better-auth session cookie, which is on a different origin.
export function fetchAdmin(path, options = {}) {
  return fetchJson(path, { ...options, credentials: 'include' })
}
