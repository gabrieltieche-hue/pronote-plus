import { useState, useEffect, useCallback, useRef } from 'react'
import { configureApi } from '../services/api'
import { useApp } from '../context/AppContext'

/**
 * Configure l'API avec le token actuel et le handler d'auth.
 * À appeler dans chaque page authentifiée.
 */
export function useApiAuth() {
  const { token, logout } = useApp()
  const onUnauthorized = useCallback(() => {
    logout({ revoke: false })
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }, [logout])

  useEffect(() => {
    configureApi({ getToken: () => token, onUnauthorized })
  }, [token, onUnauthorized])
}

/**
 * Hook générique pour fetcher une ressource via une fonction async.
 * - Loading / error / data.
 * - Refetch via `refetchIndex` (incrémenté par `refetch()`).
 * - `skip`: suspend la requête (et reset l'error).
 * - Race conditions: cancelledRef désactive les setState d'un fetch obsolète.
 */
export function useApiResource(fetcher, { deps = [], skip = false, onSuccess, onError } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState(null)
  const [refetchIndex, setRefetchIndex] = useState(0)
  const cancelledRef = useRef(false)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const refetch = useCallback(() => setRefetchIndex((i) => i + 1), [])

  useEffect(() => {
    cancelledRef.current = true
    if (skip) {
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    cancelledRef.current = false
    setLoading(true)
    setError(null)
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((d) => {
        if (cancelled) return
        setData(d)
        setLoading(false)
        onSuccess?.(d)
      })
      .catch((e) => {
        if (cancelled) return
        if (e?.status === 401) {
          setLoading(false)
          return
        }
        setError(e)
        setLoading(false)
        onError?.(e)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchIndex, skip])

  return { data, loading, error, refetch, setData }
}
