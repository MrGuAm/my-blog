"use client"

import { useState } from "react"
import { useUserSession } from "@/hooks/useUserSession"

interface CommentAuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommentAuthModal({ isOpen, onClose }: CommentAuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, register } = useUserSession()

  if (!isOpen) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      if (mode === "login") {
        await login(username, password)
      } else {
        await register(username, displayName, password)
      }
      setUsername("")
      setDisplayName("")
      setPassword("")
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border/60 rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError("") }}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground"}`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError("") }}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${mode === "register" ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground"}`}
          >
            注册
          </button>
        </div>

        <h2 className="text-2xl font-black mb-1 text-center">
          {mode === "login" ? "评论账号登录" : "创建评论账号"}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {mode === "login" ? "登录后评论不用重复填写昵称" : "注册后可以直接用昵称发表评论"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(event) => { setUsername(event.target.value); setError("") }}
            placeholder="用户名"
            autoFocus
            className="w-full h-12 px-4 rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {mode === "register" && (
            <input
              type="text"
              value={displayName}
              onChange={(event) => { setDisplayName(event.target.value); setError("") }}
              placeholder="显示昵称"
              className="w-full h-12 px-4 rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}

          <input
            type="password"
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError("") }}
            placeholder="密码"
            className="w-full h-12 px-4 rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "提交中..." : mode === "login" ? "登录" : "注册并登录"}
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
