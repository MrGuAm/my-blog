"use client"

import { useCallback, useEffect, useState } from "react"

const AUTH_EVENT = "auth-status-changed"

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status", { cache: "no-store" })
      const data = await res.json()
      setIsAuthenticated(Boolean(data.authenticated))
    } catch {
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  useEffect(() => {
    const handleAuthChange = () => {
      refreshAuth()
    }

    window.addEventListener(AUTH_EVENT, handleAuthChange)
    return () => window.removeEventListener(AUTH_EVENT, handleAuthChange)
  }, [refreshAuth])

  const login = useCallback(async (password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || "登录失败")
    }

    setIsAuthenticated(true)
    window.dispatchEvent(new Event(AUTH_EVENT))
    return data
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setIsAuthenticated(false)
    window.dispatchEvent(new Event(AUTH_EVENT))
  }, [])

  return {
    isAuthenticated,
    isLoading,
    refreshAuth,
    login,
    logout,
  }
}
