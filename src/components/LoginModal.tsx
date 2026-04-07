"use client"

import { useState } from "react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_PASSWORD) {
      document.cookie = 'authenticated=true; path=/'
      setPassword("")
      setError("")
      onSuccess()
      onClose()
    } else {
      setError("密码错误")
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border/60 rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <h2 className="text-2xl font-black mb-1 text-center">Welcome!</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">输入密码登录</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError("") }}
              placeholder="••••••••"
              autoFocus
              className="w-full h-12 px-4 pr-12 rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? "👁" : "👁‍🗨"}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            登录
          </button>
        </form>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors text-xl"
        >
          ×
        </button>
      </div>
    </div>
  )
}
