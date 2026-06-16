import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { logoutSession } from '../services/api'

const AppContext = createContext(null)

const STORAGE_KEYS = {
  token: 'pronoteplus-token',
  user: 'pronoteplus-user',
  theme: 'pronoteplus-theme',
  prefs: 'pronoteplus-prefs',
}

const DEFAULT_PREFS = {
  theme: 'system',
  reduceMotion: false,
  showClassAverage: true,
  showOverallAverage: true,
  normalizeGrades: true,
  defaultPeriod: 'current',
  weekStartsOn: 1,
  lastUrl: null,
  rememberUrl: true,
}

function loadInitial() {
  let token = null
  let user = null
  let theme = 'light'
  let prefs = { ...DEFAULT_PREFS }

  try { token = localStorage.getItem(STORAGE_KEYS.token) || null } catch {}
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    if (raw) user = JSON.parse(raw)
  } catch {}
  try {
    const t = localStorage.getItem(STORAGE_KEYS.theme)
    if (t === 'dark' || t === 'light' || t === 'system') theme = t
  } catch {}
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.prefs)
    if (raw) {
      const parsed = JSON.parse(raw)
      prefs = { ...DEFAULT_PREFS, ...parsed }
    }
  } catch {}

  return { token, user, theme, prefs }
}

function resolveTheme(themePref) {
  if (themePref === 'system') {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return themePref
}

export function AppProvider({ children }) {
  const initial = loadInitial()
  const [token, setTokenState] = useState(initial.token)
  const [user, setUserState] = useState(initial.user)
  const [themePref, setThemePref] = useState(initial.theme)
  const [prefs, setPrefs] = useState(initial.prefs)
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const resolvedTheme = themePref === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themePref

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(resolvedTheme)
    const meta = document.getElementById('theme-color-meta')
    if (meta) meta.setAttribute('content', resolvedTheme === 'dark' ? '#111416' : '#F6F8F9')
  }, [resolvedTheme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setSystemPrefersDark(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const setToken = useCallback((newToken) => {
    setTokenState(newToken)
    try {
      if (newToken) localStorage.setItem(STORAGE_KEYS.token, newToken)
      else localStorage.removeItem(STORAGE_KEYS.token)
    } catch {}
  }, [])

  const setUser = useCallback((newUser) => {
    setUserState(newUser)
    try {
      if (newUser) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser))
      else localStorage.removeItem(STORAGE_KEYS.user)
    } catch {}
  }, [])

  const toggleTheme = useCallback(() => {
    setThemePref((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(STORAGE_KEYS.theme, next) } catch {}
      return next
    })
  }, [])

  const setTheme = useCallback((newTheme) => {
    setThemePref(newTheme)
    try { localStorage.setItem(STORAGE_KEYS.theme, newTheme) } catch {}
  }, [])

  const updatePrefs = useCallback((updates) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updates }
      try { localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const logout = useCallback(async ({ revoke = true } = {}) => {
    if (revoke && token) {
      try { await logoutSession(token) } catch {}
    }
    setTokenState(null)
    setUserState(null)
    try {
      localStorage.removeItem(STORAGE_KEYS.token)
      localStorage.removeItem(STORAGE_KEYS.user)
    } catch {}
  }, [token])

  const addToast = useCallback((toast) => {
    const id = ++toastIdRef.current
    const t = { id, type: 'info', duration: 4500, ...toast }
    setToasts((prev) => [...prev, t])
    if (t.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
      }, t.duration)
    }
    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = {
    token, user, theme: resolvedTheme, themePref, prefs, toasts,
    setToken, setUser, toggleTheme, setTheme, updatePrefs, logout, addToast, dismissToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
