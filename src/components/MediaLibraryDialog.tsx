"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react"

interface MediaAsset {
  id: string
  name: string
  url: string
  size: number
  updatedAt: string
}

interface MediaLibraryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaLibraryDialog({ isOpen, onClose, onSelect }: MediaLibraryDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")

  const loadAssets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" })
      const data = await response.json()
      setAssets(Array.isArray(data.assets) ? data.assets : [])
    } catch {
      setAssets([])
      setMessage("素材库加载失败")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    loadAssets()
  }, [isOpen])

  if (!isOpen) return null

  const handleUpload = async (file?: File | null) => {
    if (!file) return
    setIsUploading(true)
    setMessage("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || "上传失败")
        return
      }
      setAssets((current) => [data.asset, ...current.filter((item) => item.id !== data.asset.id)])
      setMessage("图片已上传到媒体库")
    } catch {
      setMessage("上传失败，请重试")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (asset: MediaAsset) => {
    const confirmed = confirm(`确定删除素材 ${asset.name} 吗？`)
    if (!confirmed) return
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

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 flex max-h-[80vh] w-full max-w-4xl flex-col rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h2 className="text-xl font-black">媒体库</h2>
            <p className="text-sm text-muted-foreground">上传图片并在文章里复用。</p>
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
              onClick={onClose}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ×
            </button>
          </div>
        </div>

        {message && <p className="px-6 pt-3 text-sm text-primary">{message}</p>}

        <div className="overflow-y-auto px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">正在加载素材库...</p>
          ) : assets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => (
                <div key={asset.id} className="rounded-2xl border border-border/50 bg-background/60 p-3">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(asset.url)
                      onClose()
                    }}
                    className="block w-full overflow-hidden rounded-xl border border-border/40"
                  >
                    <img src={asset.url} alt={asset.name} className="h-44 w-full object-cover" />
                  </button>
                  <div className="mt-3 space-y-1">
                    <p className="truncate text-sm font-medium">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(asset.size)} · {new Date(asset.updatedAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(asset.url)
                        onClose()
                      }}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
                    >
                      选用
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
          ) : (
            <div className="rounded-2xl border border-border/50 bg-background/60 p-8 text-center text-muted-foreground">
              媒体库还是空的，先上传一张图片试试。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
