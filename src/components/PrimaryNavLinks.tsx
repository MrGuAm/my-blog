"use client"

import { useState } from "react"
import Link from "next/link"
import LoginModal from "@/components/LoginModal"
import { useAuthStatus } from "@/hooks/useAuthStatus"

type NavKey = "home" | "about" | "music" | "write" | "moderation" | "admin" | "media" | "tags"

interface PrimaryNavLinksProps {
  active?: NavKey
  loginRequested?: boolean
  nextPath?: string | null
  onDismissLoginRequest?: () => void
}

function navClass(isActive: boolean) {
  return `text-sm font-medium transition-colors ${
    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
  }`
}

function getSafeNextPath(value: string | null | undefined) {
  if (!value) return null
  return value.startsWith("/") && !value.startsWith("//") ? value : null
}

export default function PrimaryNavLinks({
  active,
  loginRequested = false,
  nextPath = null,
  onDismissLoginRequest,
}: PrimaryNavLinksProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { isAuthenticated, logout } = useAuthStatus()
  const loginModalOpen = isLoginModalOpen || (loginRequested && !isAuthenticated)

  const handleClose = () => {
    setIsLoginModalOpen(false)
    if (!loginRequested) return
    onDismissLoginRequest?.()
  }

  const handleSuccess = () => {
    const safeNextPath = getSafeNextPath(nextPath)
    if (safeNextPath && typeof window !== "undefined") {
      window.location.href = safeNextPath
      return
    }
    onDismissLoginRequest?.()
  }

  return (
    <>
      <Link href="/home" className={navClass(active === "home")}>
        Home
      </Link>
      <Link href="/about" className={navClass(active === "about")}>
        About
      </Link>
      <Link href="/music" className={navClass(active === "music")}>
        Music
      </Link>
      {isAuthenticated ? (
        <>
          <Link href="/write" className={navClass(active === "write")}>
            写文章
          </Link>
          <Link href="/moderation" className={navClass(active === "moderation")}>
            审核评论
          </Link>
          <Link href="/admin" className={navClass(active === "admin")}>
            后台
          </Link>
          <Link href="/admin/media" className={navClass(active === "media")}>
            媒体库
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium text-red-500 transition-colors hover:text-red-600"
          >
            退出
          </button>
        </>
      ) : (
        <>
          {active === "tags" ? (
            <Link href="/tags" className={navClass(true)}>
              全部标签
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="apple-button-secondary"
            title="仅站点管理员使用"
          >
            管理
          </button>
        </>
      )}

      <LoginModal
        isOpen={loginModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </>
  )
}
