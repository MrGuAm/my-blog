"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import { useSiteSettings } from "@/hooks/useSiteSettings"
import LoginModal from "@/components/LoginModal"

export type NavKey = "home" | "about" | "music" | "write" | "moderation" | "admin" | "media" | "settings" | "tags"

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

function desktopNavClass(isActive: boolean) {
  return navClass(isActive)
}

function mobileNavClass(isActive: boolean) {
  return `rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
    isActive
      ? "bg-primary text-primary-foreground"
      : "border border-white/60 bg-white/70 text-foreground/80 hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-white/80"
  }`
}

export default function PrimaryNavLinks({
  active,
  loginRequested = false,
  nextPath = null,
  onDismissLoginRequest,
}: PrimaryNavLinksProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDesktopAdminMenuOpen, setIsDesktopAdminMenuOpen] = useState(false)
  const desktopAdminMenuRef = useRef<HTMLDivElement | null>(null)
  const desktopAdminCloseTimerRef = useRef<number | null>(null)
  const { isAuthenticated, logout } = useAuthStatus()
  const siteSettings = useSiteSettings()
  const loginModalOpen = isLoginModalOpen || (loginRequested && !isAuthenticated)
  const baseItems = [
    { href: "/home", label: "Home", key: "home" as NavKey },
    { href: "/about", label: "About", key: "about" as NavKey },
    { href: "/music", label: "Music", key: "music" as NavKey },
  ]
  const authItems = [
    { href: "/write", label: "写文章", key: "write" as NavKey },
    { href: "/moderation", label: "审核评论", key: "moderation" as NavKey },
    { href: "/admin", label: "后台", key: "admin" as NavKey },
    { href: "/admin/media", label: "素材库", key: "media" as NavKey },
    { href: "/admin/settings", label: "设置", key: "settings" as NavKey },
  ]
  const tagItem = active === "tags" ? [{ href: "/tags", label: "全部标签", key: "tags" as NavKey }] : []
  const desktopPrimaryItems = [...baseItems, ...tagItem]
  const mobileNavItems = [...baseItems, ...tagItem, ...(isAuthenticated ? authItems : [])]

  useEffect(() => {
    if (!isDesktopAdminMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!desktopAdminMenuRef.current?.contains(event.target as Node)) {
        setIsDesktopAdminMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDesktopAdminMenuOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("mousedown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isDesktopAdminMenuOpen])

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

  const handleOpenLogin = () => {
    setIsMobileMenuOpen(false)
    setIsDesktopAdminMenuOpen(false)
    setIsLoginModalOpen(true)
  }

  const clearDesktopAdminCloseTimer = () => {
    if (desktopAdminCloseTimerRef.current !== null) {
      window.clearTimeout(desktopAdminCloseTimerRef.current)
      desktopAdminCloseTimerRef.current = null
    }
  }

  const openDesktopAdminMenu = () => {
    clearDesktopAdminCloseTimer()
    setIsDesktopAdminMenuOpen(true)
  }

  const scheduleDesktopAdminMenuClose = () => {
    clearDesktopAdminCloseTimer()
    desktopAdminCloseTimerRef.current = window.setTimeout(() => {
      setIsDesktopAdminMenuOpen(false)
      desktopAdminCloseTimerRef.current = null
    }, 120)
  }

  const handleLogout = async () => {
    setIsMobileMenuOpen(false)
    setIsDesktopAdminMenuOpen(false)
    await logout()
  }

  return (
    <>
      <div className="hidden items-center gap-3 md:flex lg:gap-4">
        {desktopPrimaryItems.map((item) => (
          <Link key={item.href} href={item.href} className={desktopNavClass(active === item.key)}>
            {item.label}
          </Link>
        ))}
        {isAuthenticated ? (
          <>
            <div
              ref={desktopAdminMenuRef}
              className="relative"
              onMouseEnter={openDesktopAdminMenu}
              onMouseLeave={scheduleDesktopAdminMenuClose}
            >
              <button
                type="button"
                onClick={openDesktopAdminMenu}
                onFocus={openDesktopAdminMenu}
                className="apple-button-secondary px-3 py-1.5"
                aria-expanded={isDesktopAdminMenuOpen}
                aria-haspopup="menu"
              >
                管理
              </button>
              {isDesktopAdminMenuOpen ? (
                <div className="apple-panel absolute right-0 top-full z-30 mt-3 w-44 rounded-3xl border-white/90 bg-white/92 p-3 shadow-[0_28px_85px_-34px_rgba(15,23,42,0.28)] ring-1 ring-black/6 dark:border-white/20 dark:bg-slate-950/92 dark:ring-white/10 dark:shadow-[0_28px_85px_-34px_rgba(0,0,0,0.82)]">
                  <div className="grid gap-1.5">
                    {authItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsDesktopAdminMenuOpen(false)}
                        className={`rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${
                          active === item.key ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-2xl px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/8"
                    >
                      退出
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={handleOpenLogin}
            className="apple-button-secondary"
            title="仅站点管理员使用"
          >
            管理
          </button>
        )}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="apple-button-secondary px-3 py-1.5"
          aria-label="打开导航菜单"
        >
          菜单
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-[90] md:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="apple-panel absolute inset-x-4 top-20 rounded-[1.75rem] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="section-kicker">Navigation</p>
                <p className="mt-1 text-base font-semibold tracking-[-0.03em]">{siteSettings.brandName} 菜单</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="apple-button-secondary px-3 py-1.5"
                aria-label="关闭导航菜单"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-2">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileNavClass(active === item.key)}
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-red-500/25 px-4 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/8"
                >
                  退出
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenLogin}
                  className="brand-solid-button w-full py-3"
                >
                  进入管理
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <LoginModal
        isOpen={loginModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        brandName={siteSettings.brandName}
      />
    </>
  )
}
