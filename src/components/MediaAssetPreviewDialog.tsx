"use client"
/* eslint-disable @next/next/no-img-element */

import type { MediaAsset } from "@/lib/server/media"
import MediaUsageReferenceList from "@/components/MediaUsageReferenceList"

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDimensions(width?: number | null, height?: number | null) {
  if (!width || !height) return "未知"
  return `${width} × ${height}`
}

export default function MediaAssetPreviewDialog({
  asset,
  isOpen,
  onClose,
  onSelect,
  openUsageInNewTab = false,
}: {
  asset: MediaAsset | null
  isOpen: boolean
  onClose: () => void
  onSelect?: ((asset: MediaAsset) => void) | null
  openUsageInNewTab?: boolean
}) {
  if (!isOpen || !asset) return null

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h2 className="text-xl font-black">素材预览</h2>
            <p className="text-sm text-muted-foreground">{asset.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {onSelect ? (
              <button
                type="button"
                onClick={() => {
                  onSelect(asset)
                  onClose()
                }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                选用
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid gap-0 overflow-y-auto lg:grid-cols-[1.3fr_0.7fr]">
          <div className="border-b border-border/50 bg-background/50 p-4 lg:border-b-0 lg:border-r">
            <div className="flex min-h-[20rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-border/50 bg-card">
              <img src={asset.url} alt={asset.name} className="max-h-[68vh] w-full object-contain" />
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">元信息</p>
              <p className="text-sm text-muted-foreground">大小：{formatSize(asset.size)}</p>
              <p className="text-sm text-muted-foreground">尺寸：{formatDimensions(asset.width, asset.height)}</p>
              <p className="text-sm text-muted-foreground">来源：{asset.storage === "blob" ? "Blob" : "本地"}</p>
              <p className="text-sm text-muted-foreground">更新时间：{new Date(asset.updatedAt).toLocaleString("zh-CN")}</p>
              <p className="text-sm text-muted-foreground">使用情况：{asset.usageCount ?? 0} 篇文章</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">快速复制</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyValue(asset.url)}
                  className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
                >
                  链接
                </button>
                <button
                  type="button"
                  onClick={() => copyValue(`![${asset.name}](${asset.url})`)}
                  className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
                >
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => copyValue(`<img src="${asset.url}" alt="${asset.name}" />`)}
                  className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
                >
                  HTML
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">引用文章</p>
              <MediaUsageReferenceList
                assetId={asset.id}
                usagePosts={asset.usagePosts}
                openInNewTab={openUsageInNewTab}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
