"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import MediaAssetCard from "@/components/MediaAssetCard"
import MediaAssetPreviewDialog from "@/components/MediaAssetPreviewDialog"
import MediaCollectionEmptyState from "@/components/MediaCollectionEmptyState"
import MediaFiltersBar from "@/components/MediaFiltersBar"
import MediaUploadDropzone from "@/components/MediaUploadDropzone"
import {
  getMediaFormatFilter,
  getMediaOrientation,
  MEDIA_UPLOAD_ACCEPT,
  formatMediaUploadBatchMessage,
  getMediaUploadHint,
  sortMediaAssets,
  validateMediaUploadInput,
  type MediaFormatFilter,
  type MediaSortOption,
  type MediaUploadFailure,
} from "@/lib/media-upload"
import type { MediaAsset } from "@/lib/server/media"
import { getMediaUsageScope } from "@/lib/media-usage"

interface MediaLibraryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  autoSelectUpload?: boolean
  uploadHint?: string
}

export default function MediaLibraryDialog({
  isOpen,
  onClose,
  onSelect,
  autoSelectUpload = false,
  uploadHint,
}: MediaLibraryDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [warning, setWarning] = useState("")
  const [canUpload, setCanUpload] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [timeFilter, setTimeFilter] = useState<"all" | "7d" | "30d">("all")
  const [storageFilter, setStorageFilter] = useState<"all" | "blob" | "local">("all")
  const [formatFilter, setFormatFilter] = useState<MediaFormatFilter>("all")
  const [orientationFilter, setOrientationFilter] = useState<"all" | "landscape" | "portrait" | "square">("all")
  const [usageFilter, setUsageFilter] = useState<"all" | "used" | "unused">("all")
  const [usageKindFilter, setUsageKindFilter] = useState<"all" | "cover" | "content" | "mixed">("all")
  const [sortBy, setSortBy] = useState<MediaSortOption>("newest")
  const [referenceNow, setReferenceNow] = useState(() => Date.now())
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)
  const uploadHintText = uploadHint ?? getMediaUploadHint()

  const loadAssets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" })
      const data = await response.json()
      setAssets(Array.isArray(data.assets) ? data.assets : [])
      setWarning(typeof data.warning === "string" ? data.warning : "")
      setCanUpload(Boolean(data.canUpload))
      setReferenceNow(Date.now())
    } catch {
      setAssets([])
      setMessage("素材库加载失败")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const timeoutId = window.setTimeout(() => {
      void loadAssets()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [isOpen])

  const filteredAssets = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    const nextAssets = assets.filter((asset) => {
      if (normalizedKeyword && !asset.name.toLowerCase().includes(normalizedKeyword)) {
        return false
      }

      if (storageFilter !== "all" && asset.storage !== storageFilter) {
        return false
      }

      if (formatFilter !== "all" && getMediaFormatFilter(asset.contentType) !== formatFilter) {
        return false
      }

      const orientation = getMediaOrientation(asset.width, asset.height)
      if (orientationFilter !== "all" && orientation !== orientationFilter) {
        return false
      }

      const usageCount = asset.usageCount ?? 0
      if (usageFilter === "used" && usageCount === 0) {
        return false
      }
      if (usageFilter === "unused" && usageCount > 0) {
        return false
      }

      const usageScope = getMediaUsageScope(asset.usagePosts)
      if (usageKindFilter !== "all" && usageScope !== usageKindFilter) {
        return false
      }

      if (timeFilter === "all") return true
      const days = timeFilter === "7d" ? 7 : 30
      return referenceNow - new Date(asset.updatedAt).getTime() <= days * 24 * 60 * 60 * 1000
    })
    return sortMediaAssets(nextAssets, sortBy)
  }, [assets, formatFilter, keyword, orientationFilter, referenceNow, sortBy, storageFilter, timeFilter, usageFilter, usageKindFilter])
  const previewIndex = previewAsset ? filteredAssets.findIndex((asset) => asset.id === previewAsset.id) : -1
  const hasActiveFilters =
    keyword.trim().length > 0 ||
    timeFilter !== "all" ||
    storageFilter !== "all" ||
    formatFilter !== "all" ||
    orientationFilter !== "all" ||
    usageFilter !== "all" ||
    usageKindFilter !== "all" ||
    sortBy !== "newest"

  if (!isOpen) return null

  const copyAssetValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(`${label}已复制`)
    } catch {
      setMessage("复制失败，请重试")
    }
  }

  const resetFilters = () => {
    setKeyword("")
    setTimeFilter("all")
    setStorageFilter("all")
    setFormatFilter("all")
    setOrientationFilter("all")
    setUsageFilter("all")
    setUsageKindFilter("all")
    setSortBy("newest")
  }

  const handleUploads = async (files: File[] = []) => {
    if (!files.length || !canUpload) return
    setIsUploading(true)
    setMessage("")
    try {
      const localFailures: MediaUploadFailure[] = []
      const validFiles: File[] = []
      for (const file of files) {
        const validationError = validateMediaUploadInput(file)
        if (validationError) {
          localFailures.push({ name: file.name || "未命名文件", reason: validationError })
          continue
        }
        validFiles.push(file)
      }

      const uploadedAssets: MediaAsset[] = []
      const remoteFailures: MediaUploadFailure[] = []

      if (validFiles.length > 0) {
        const formData = new FormData()
        for (const file of validFiles) {
          formData.append("file", file)
        }

        const response = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) {
          if (Array.isArray(data.failures) && data.failures.length > 0) {
            remoteFailures.push(...data.failures)
          } else {
            remoteFailures.push({ name: "本次上传", reason: data.error || "上传失败" })
          }
        } else {
          uploadedAssets.push(...(Array.isArray(data.assets) ? data.assets : data.asset ? [data.asset] : []))
          if (Array.isArray(data.failures)) {
            remoteFailures.push(...data.failures)
          }
        }
      }

      const failures = [...localFailures, ...remoteFailures]

      if (uploadedAssets.length > 0) {
        setAssets((current) => [
          ...uploadedAssets,
          ...current.filter((item) => !uploadedAssets.some((asset) => asset.id === item.id)),
        ])
      }

      if (autoSelectUpload && uploadedAssets.length === 1 && failures.length === 0) {
        onSelect(uploadedAssets[0].url)
        onClose()
        return
      }

      if (uploadedAssets.length > 0 || failures.length > 0) {
        setMessage(
          formatMediaUploadBatchMessage({
            successCount: uploadedAssets.length,
            failures,
            autoSelected: false,
          })
        )
      }
      setReferenceNow(Date.now())
    } catch {
      setMessage("上传失败，请重试")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (asset: MediaAsset) => {
    if (!asset.deletable) {
      setMessage("当前素材来自随代码部署的本地目录，线上环境不能直接删除。")
      return
    }
    const confirmed = confirm(`确定删除素材 ${asset.name} 吗？`)
    if (!confirmed) return
    try {
      const response = await fetch(`/api/admin/media?id=${encodeURIComponent(asset.id)}`, { method: "DELETE" })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || "删除失败")
        return
      }
      setAssets((current) => current.filter((item) => item.id !== asset.id))
      setMessage("素材已删除")
      setReferenceNow(Date.now())
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
            <p className="mt-1 text-xs text-muted-foreground">{uploadHintText}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={MEDIA_UPLOAD_ACCEPT}
              multiple
              className="hidden"
              onChange={(event) => {
                handleUploads(Array.from(event.target.files ?? []))
                event.target.value = ""
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canUpload}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!canUpload ? "请先配置 Blob" : isUploading ? "上传中..." : "更多上传方式"}
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
        {warning && <p className="px-6 pt-3 text-sm text-amber-600">{warning}</p>}

        <div className="overflow-y-auto px-6 py-5">
          <MediaUploadDropzone
            canUpload={canUpload}
            isUploading={isUploading}
            hint={uploadHintText}
            onSelectFiles={handleUploads}
            className="mb-5"
          />
          <MediaFiltersBar
            keyword={keyword}
            onKeywordChange={setKeyword}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            storageFilter={storageFilter}
            onStorageFilterChange={setStorageFilter}
            formatFilter={formatFilter}
            onFormatFilterChange={setFormatFilter}
            orientationFilter={orientationFilter}
            onOrientationFilterChange={setOrientationFilter}
            usageFilter={usageFilter}
            onUsageFilterChange={setUsageFilter}
            usageKindFilter={usageKindFilter}
            onUsageKindFilterChange={setUsageKindFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            controlClassName="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
            searchClassName="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm sm:max-w-xs"
            showReset={hasActiveFilters}
            onReset={resetFilters}
          />

          {isLoading ? (
            <p className="text-sm text-muted-foreground">正在加载素材库...</p>
          ) : filteredAssets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredAssets.map((asset) => (
                <MediaAssetCard
                  key={asset.id}
                  asset={asset}
                  onPreview={() => setPreviewAsset(asset)}
                  openUsageInNewTab
                  className="rounded-2xl border border-border/50 bg-background/60 p-3"
                  imageClassName="h-44 w-full object-cover"
                  actions={
                    <>
                    <button
                      type="button"
                      onClick={() => setPreviewAsset(asset)}
                      className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      预览
                    </button>
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
                      onClick={() => copyAssetValue(`![${asset.name}](${asset.url})`, "Markdown ")}
                      className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      Markdown
                    </button>
                    <button
                      type="button"
                      onClick={() => copyAssetValue(`<img src="${asset.url}" alt="${asset.name}" />`, "HTML ")}
                      className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(asset)}
                      disabled={!asset.deletable || (asset.usageCount ?? 0) > 0}
                      aria-label={(asset.usageCount ?? 0) > 0 ? `素材 ${asset.name} 使用中，无法删除` : `删除素材 ${asset.name}`}
                      title={(asset.usageCount ?? 0) > 0 ? `素材 ${asset.name} 使用中，无法删除` : `删除素材 ${asset.name}`}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {(asset.usageCount ?? 0) > 0 ? "使用中" : "删除"}
                    </button>
                    </>
                  }
                />
              ))}
            </div>
          ) : assets.length > 0 ? (
            <MediaCollectionEmptyState
              message="当前筛选条件下没有素材，换个关键词或时间范围试试。"
              className="rounded-2xl border border-border/50 bg-background/60 p-8 text-center text-muted-foreground"
            />
          ) : (
            <MediaCollectionEmptyState
              message="媒体库还是空的，先上传一张图片试试。"
              className="rounded-2xl border border-border/50 bg-background/60 p-8 text-center text-muted-foreground"
            />
          )}
        </div>
        <MediaAssetPreviewDialog
          key={previewAsset?.id || "dialog-media-preview"}
          asset={previewAsset}
          isOpen={Boolean(previewAsset)}
          onClose={() => setPreviewAsset(null)}
          onSelect={(asset) => onSelect(asset.url)}
          openUsageInNewTab
          onPrevious={
            previewIndex > 0
              ? () => setPreviewAsset(filteredAssets[previewIndex - 1] ?? null)
              : null
          }
          onNext={
            previewIndex >= 0 && previewIndex < filteredAssets.length - 1
              ? () => setPreviewAsset(filteredAssets[previewIndex + 1] ?? null)
              : null
          }
          hasPrevious={previewIndex > 0}
          hasNext={previewIndex >= 0 && previewIndex < filteredAssets.length - 1}
          positionLabel={previewIndex >= 0 ? `${previewIndex + 1} / ${filteredAssets.length}` : undefined}
          thumbnailAssets={filteredAssets}
          onJumpToAsset={(asset) => setPreviewAsset(asset)}
        />
      </div>
    </div>
  )
}
