const API_URL = import.meta.env.VITE_API_URL || ''

class ApiError extends Error {
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

  const res = await fetch(`${API_URL}${path}`, { headers, ...options })

  let data = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await res.json()
  }

  if (!res.ok) {
    if (res.status === 401 && onUnauthorizedFn) {
      onUnauthorizedFn()
    }
    throw new ApiError(
      (data && data.error) || `Erreur ${res.status}`,
      res.status,
      data
    )
  }
  return data
}

export async function login(url, username, password, kind = 'student') {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ url, username, password, kind }),
  })
}

export async function fetchUser() {
  return request('/api/user')
}

export async function fetchPeriods() {
  return request('/api/periods')
}

export async function fetchGrades(periodId) {
  const params = periodId ? `?periodId=${encodeURIComponent(periodId)}` : ''
  return request(`/api/grades${params}`)
}

export async function fetchTimetable(from, to) {
  const params = new URLSearchParams()
  if (from) params.set('from', from instanceof Date ? from.toISOString() : from)
  if (to) params.set('to', to instanceof Date ? to.toISOString() : to)
  const qs = params.toString()
  return request(`/api/timetable${qs ? `?${qs}` : ''}`)
}

export async function fetchHomeworks(from, to) {
  const params = new URLSearchParams()
  if (from) params.set('from', from instanceof Date ? from.toISOString() : from)
  if (to) params.set('to', to instanceof Date ? to.toISOString() : to)
  const qs = params.toString()
  return request(`/api/homeworks${qs ? `?${qs}` : ''}`)
}

export async function pingHealth() {
  return request('/api/health')
}

export { ApiError }
