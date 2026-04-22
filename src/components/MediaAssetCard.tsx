"use client"
/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react"
import type { MediaAsset } from "@/lib/server/media"
import MediaUsageReferenceList from "@/components/MediaUsageReferenceList"

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDimensions(width?: number | null, height?: number | null) {
  if (!width || !height) return null
  return `${width} × ${height}`
}

interface MediaAssetCardProps {
  asset: MediaAsset
  onPreview: () => void
  topBar?: ReactNode
  actions?: ReactNode
  openUsageInNewTab?: boolean
  className?: string
  surfaceClassName?: string
  imageClassName?: string
}

export default function MediaAssetCard({
  asset,
  onPreview,
  topBar,
  actions,
  openUsageInNewTab = false,
  className = "rounded-2xl border border-border/50 bg-card p-3",
  surfaceClassName = "block w-full overflow-hidden rounded-xl border border-border/40",
  imageClassName = "h-52 w-full object-cover",
}: MediaAssetCardProps) {
  return (
    <div className={className}>
      {topBar ? <div className="mb-3">{topBar}</div> : null}
      <button
        type="button"
        onClick={onPreview}
        className={surfaceClassName}
      >
        <img src={asset.url} alt={asset.name} className={imageClassName} />
      </button>
      <div className="mt-3 space-y-1">
        <p className="truncate text-sm font-medium">{asset.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(asset.size)}
          {formatDimensions(asset.width, asset.height) ? ` · ${formatDimensions(asset.width, asset.height)}` : ""}
          {" · "}
          {new Date(asset.updatedAt).toLocaleString("zh-CN")}
          {asset.storage ? ` · ${asset.storage === "blob" ? "Blob" : "本地"}` : ""}
          {typeof asset.usageCount === "number" ? ` · 使用于 ${asset.usageCount} 篇文章` : ""}
        </p>
        <MediaUsageReferenceList
          assetId={asset.id}
          usagePosts={asset.usagePosts}
          openInNewTab={openUsageInNewTab}
        />
      </div>
      {actions ? <div className="mt-3 flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
