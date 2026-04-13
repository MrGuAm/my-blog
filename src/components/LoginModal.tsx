"use client"

import { useState } from "react"
import { useAuthStatus } from "@/hooks/useAuthStatus"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuthStatus()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(password)
      setPassword("")
      setError("")
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "密码错误")
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/32 backdrop-blur-xl" onClick={onClose} />
      <div className="apple-panel relative mx-4 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5a4030] text-sm font-semibold text-white shadow-lg shadow-amber-900/15">
          C
        </div>
        <p className="text-center text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Admin Access</p>
        <h2 className="mt-2 text-center text-3xl font-semibold tracking-[-0.04em]">站点管理</h2>
        <p className="mt-2 text-sm text-muted-foreground text-center mb-6">输入管理员密码继续</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError("") }}
              placeholder="••••••••"
              autoFocus
              className="apple-input h-12 w-full px-4 pr-20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? "隐藏" : "显示"}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="h-12 w-full rounded-full bg-[#5a4030] text-sm font-medium text-white transition-colors hover:bg-[#6a4c39]"
          >
            进入管理
          </button>
        </form>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors text-xl"
        >
          ×
        </button>
      </div>
    </div>
  )
}
