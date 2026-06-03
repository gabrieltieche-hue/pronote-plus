import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AppContext = createContext(null)

const STORAGE_KEYS = {
  token: 'pronoteplus-token',
  user: 'pronoteplus-user',
  theme: 'pronoteplus-theme',
}

function loadInitial() {
  let token = null
  let user = null
  let theme = 'dark'

  try {
    token = localStorage.getItem(STORAGE_KEYS.token) || null
  } catch {}
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    if (raw) user = JSON.parse(raw)
  } catch {}
  try {
    const t = localStorage.getItem(STORAGE_KEYS.theme)
    if (t === 'dark' || t === 'light') theme = t
  } catch {}

  return { token, user, theme }
}

export function AppProvider({ children }) {
  const [{ token, user, theme }, setState] = useState(loadInitial)

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(theme)
    const meta = document.getElementById('theme-color-meta')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#181829' : '#E4E4FF')
  }, [theme])

  const setToken = useCallback((newToken) => {
    setState((prev) => {
      const next = { ...prev, token: newToken }
      try {
        if (newToken) localStorage.setItem(STORAGE_KEYS.token, newToken)
        else localStorage.removeItem(STORAGE_KEYS.token)
      } catch {}
      return next
    })
  }, [])

  const setUser = useCallback((newUser) => {
    setState((prev) => {
      const next = { ...prev, user: newUser }
      try {
        if (newUser) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser))
        else localStorage.removeItem(STORAGE_KEYS.user)
      } catch {}
      return next
    })
  }, [])

  const toggleTheme = useCallback(() => {
    setState((prev) => {
      const next = prev.theme === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(STORAGE_KEYS.theme, next) } catch {}
      return { ...prev, theme: next }
    })
  }, [])

  const logout = useCallback(() => {
    setState((prev) => {
      try {
        localStorage.removeItem(STORAGE_KEYS.token)
        localStorage.removeItem(STORAGE_KEYS.user)
      } catch {}
      return { ...prev, token: null, user: null }
    })
  }, [])

  const value = { token, user, theme, setToken, setUser, toggleTheme, logout }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
