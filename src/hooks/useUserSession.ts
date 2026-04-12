"use client"

import { useCallback, useEffect, useState } from "react"

const USER_AUTH_EVENT = "comment-user-auth-changed"

interface UserSessionState {
  isAuthenticated: boolean
  userId: string | null
  username: string | null
  displayName: string | null
}

const initialState: UserSessionState = {
  isAuthenticated: false,
  userId: null,
  username: null,
  displayName: null,
}

export function useUserSession() {
  const [session, setSession] = useState<UserSessionState>(initialState)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/user/status", { cache: "no-store" })
      const data = await res.json()
      if (data.authenticated) {
        setSession({
          isAuthenticated: true,
          userId: data.userId ?? null,
          username: data.username ?? null,
          displayName: data.displayName ?? null,
        })
      } else {
        setSession(initialState)
      }
    } catch {
      setSession(initialState)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  useEffect(() => {
    const handleChange = () => {
      refreshSession()
    }

    window.addEventListener(USER_AUTH_EVENT, handleChange)
    return () => window.removeEventListener(USER_AUTH_EVENT, handleChange)
  }, [refreshSession])

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "登录失败")
    window.dispatchEvent(new Event(USER_AUTH_EVENT))
    return data
  }, [])

  const register = useCallback(async (username: string, displayName: string, password: string) => {
    const res = await fetch("/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, displayName, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "注册失败")
    window.dispatchEvent(new Event(USER_AUTH_EVENT))
    return data
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/user/logout", { method: "POST" })
    setSession(initialState)
    window.dispatchEvent(new Event(USER_AUTH_EVENT))
  }, [])

  return {
    ...session,
    isLoading,
    refreshSession,
    login,
    register,
    logout,
  }
}
