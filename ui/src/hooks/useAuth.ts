import { useState, useEffect, useCallback } from 'react'

export function useAuth() {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [needsBootstrap, setNeedsBootstrap] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/config')
      if (res.status === 200) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    } catch (e) {
      setIsAuthenticated(false)
    }

    try {
      const bootRes = await fetch('/api/auth/bootstrap', { method: 'POST', body: '{}' })
      if (bootRes.status === 400 || bootRes.status === 200) {
        setNeedsBootstrap(true)
      } else if (bootRes.status === 403) {
        setNeedsBootstrap(false)
      }
    } catch (e) {
      console.error(e)
    }

    setLoading(false)
  }, [])

  const login = async (password: string, isBootstrap: boolean) => {
    const endpoint = isBootstrap ? '/api/auth/bootstrap' : '/api/auth/login'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })

    if (res.ok) {
      setIsAuthenticated(true)
      return { success: true }
    } else {
      return { success: false, error: await res.text() || 'Authentication failed' }
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setIsAuthenticated(false)
    checkAuth()
  }

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    loading,
    isAuthenticated,
    needsBootstrap,
    login,
    logout,
    checkAuth
  }
}
