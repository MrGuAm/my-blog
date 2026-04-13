"use client"
/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import type { MediaAsset } from "@/lib/server/media"

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminMediaClient({ initialAssets, initialWarning = null }: { initialAssets: MediaAsset[]; initialWarning?: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { logout } = useAuthStatus()
  const [assets, setAssets] = useState(initialAssets)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [warning, setWarning] = useState(initialWarning)
  const [keyword, setKeyword] = useState("")
  const [timeFilter, setTimeFilter] = useState<"all" | "7d" | "30d">("all")

  const refreshAssets = async () => {
    const response = await fetch("/api/admin/media", { cache: "no-store" })
    const data = await response.json()
    setAssets(Array.isArray(data.assets) ? data.assets : [])
    setWarning(typeof data.warning === "string" ? data.warning : null)
  }

  const handleUpload = async (file?: File | null) => {
    if (!file) return
    setIsUploading(true)
    setMessage("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/admin/media", { method: "POST", body: formData })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || "上传失败")
        return
      }
      setAssets((current) => [data.asset, ...current.filter((item) => item.id !== data.asset.id)])
      setMessage("素材上传成功")
    } catch {
      setMessage("上传失败，请重试")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm(`确定删除素材 ${asset.name} 吗？`)) return
    setMessage("")
    try {
      const response = await fetch(`/api/admin/media?name=${encodeURIComponent(asset.name)}`, { method: "DELETE" })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || "删除失败")
        return
      }
      setAssets((current) => current.filter((item) => item.id !== asset.id))
      setMessage("素材已删除")
    } catch {
      setMessage("删除失败，请重试")
    }
  }

  const filteredAssets = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    const now = Date.now()
    return assets.filter((asset) => {
      if (normalizedKeyword && !asset.name.toLowerCase().includes(normalizedKeyword)) {
        return false
      }

      if (timeFilter === "all") return true
      const days = timeFilter === "7d" ? 7 : 30
      return now - new Date(asset.updatedAt).getTime() <= days * 24 * 60 * 60 * 1000
    })
  }, [assets, keyword, timeFilter])

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(`${label}已复制`)
    } catch {
      setMessage("复制失败，请重试")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#6C3FF5]/60">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-lg font-black">媒体库</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-muted-foreground transition-colors hover:text-primary">返回后台</Link>
            <Link href="/write?from=/admin/media" className="text-sm text-muted-foreground transition-colors hover:text-primary">写文章</Link>
            <button onClick={logout} className="text-sm text-red-500 transition-colors hover:text-red-600">退出</button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">站内媒体素材</h1>
            <p className="mt-2 text-muted-foreground">集中管理文章中要复用的图片素材。</p>
            {message && <p className="mt-3 text-sm text-primary">{message}</p>}
            {warning && <p className="mt-2 text-sm text-amber-600">{warning}</p>}
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索素材名称"
                className="w-full rounded-xl border border-border/50 bg-card px-3 py-2 text-sm sm:w-64"
              />
              <div className="inline-flex rounded-full border border-border/50 bg-card p-1 text-sm">
                {[
                  ["all", "全部"],
                  ["7d", "7 天内"],
                  ["30d", "30 天内"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTimeFilter(value as "all" | "7d" | "30d")}
                    className={`rounded-full px-3 py-1 transition-colors ${
                      timeFilter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                handleUpload(file)
                event.target.value = ""
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {isUploading ? "上传中..." : "上传图片"}
            </button>
            <button
              type="button"
              onClick={refreshAssets}
              className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
            >
              刷新
            </button>
            </div>
          </div>
        </div>

        {filteredAssets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="rounded-2xl border border-border/50 bg-card p-3">
                <div className="overflow-hidden rounded-xl border border-border/40">
                  <img src={asset.url} alt={asset.name} className="h-52 w-full object-cover" />
                </div>
                <div className="mt-3 space-y-1">
                  <p className="truncate text-sm font-medium">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(asset.size)} · {new Date(asset.updatedAt).toLocaleString("zh-CN")}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyValue(asset.url, "素材链接")}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
                  >
                    链接
                  </button>
                  <button
                    type="button"
                    onClick={() => copyValue(`![${asset.name}](${asset.url})`, "Markdown")}
                    className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
                  >
                    Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => copyValue(`<img src="${asset.url}" alt="${asset.name}" />`, "HTML")}
                    className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
                  >
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(asset)}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : assets.length > 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
            当前筛选条件下没有素材，换个关键词或时间范围试试。
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
            还没有任何素材，先上传一张图片试试。
          </div>
        )}
      </div>
    </div>
  )
}
