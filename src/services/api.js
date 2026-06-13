const API_URL = import.meta.env.VITE_API_URL || ''

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

let getTokenFn = () => null
let onUnauthorizedFn = () => {}

export function configureApi({ getToken, onUnauthorized } = {}) {
  if (getToken) getTokenFn = getToken
  if (onUnauthorized) onUnauthorizedFn = onUnauthorized
}

async function request(path, options = {}) {
  const token = getTokenFn()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, { headers, ...options })
  } catch (e) {
    throw new ApiError('Impossible de contacter le serveur. Vérifie ta connexion.', 0, null)
  }

  let data = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try { data = await res.json() } catch { data = null }
  }

  if (!res.ok) {
    if (res.status === 401) {
      try { onUnauthorizedFn && onUnauthorizedFn() } catch {}
    }
    throw new ApiError(
      (data && data.error) || `Erreur ${res.status}`,
      res.status,
      data
    )
  }
  return data
}

function qs(params) {
  if (!params) return ''
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    sp.set(k, v instanceof Date ? v.toISOString() : String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const login = (url, username, password, kind = 'student') =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ url, username, password, kind }),
  })

export async function logoutSession(token) {
  if (!token) return
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {}
}
export const fetchUser = () => request('/api/user')
export const fetchPeriods = () => request('/api/periods')
export const fetchGrades = (periodId) => request(`/api/grades${qs({ periodId })}`)
export const fetchTimetable = (from, to) => request(`/api/timetable${qs({ from, to })}`)
export const fetchHomeworks = (from, to) => request(`/api/homeworks${qs({ from, to })}`)
export const fetchVieScolaire = () => request('/api/vie-scolaire')
export const fetchDiscussions = () => request('/api/discussions')
export const fetchDiscussionMessages = (id) => request(`/api/discussions/${encodeURIComponent(id)}/messages`)
export const sendDiscussionMessage = (id, content) => request(`/api/discussions/${encodeURIComponent(id)}/messages`, {
  method: 'POST',
  body: JSON.stringify({ content }),
})
export const markDiscussionRead = (id) => request(`/api/discussions/${encodeURIComponent(id)}/read`, { method: 'POST' })
export const pingHealth = () => request('/api/health')
