"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import MediaUploadDropzone from "@/components/MediaUploadDropzone"
import SectionPageShell from "@/components/SectionPageShell"
import {
  buildMediaAssetBatchText,
  getMediaOrientation,
  MEDIA_UPLOAD_ACCEPT,
  formatMediaUploadBatchMessage,
  getMediaUploadHint,
  sortMediaAssets,
  validateMediaUploadInput,
  type MediaSortOption,
  type MediaUploadFailure,
} from "@/lib/media-upload"
import type { MediaAsset } from "@/lib/server/media"
import { getMediaUsageHref } from "@/lib/media-usage"

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDimensions(width?: number | null, height?: number | null) {
  if (!width || !height) return null
  return `${width} × ${height}`
}

function formatUsageKind(kind: "cover" | "content" | "cover+content") {
  if (kind === "cover") return "封面"
  if (kind === "content") return "正文"
  return "封面+正文"
}

export default function AdminMediaClient({
  initialAssets,
  initialWarning = null,
  initialCanUpload = true,
  brandName,
  initialKeyword = "",
  initialTimeFilter = "all",
  initialStorageFilter = "all",
  initialOrientationFilter = "all",
  initialUsageFilter = "all",
  initialSortBy = "newest",
  initialPage = 1,
}: {
  initialAssets: MediaAsset[]
  initialWarning?: string | null
  initialCanUpload?: boolean
  brandName: string
  initialKeyword?: string
  initialTimeFilter?: "all" | "7d" | "30d"
  initialStorageFilter?: "all" | "blob" | "local"
  initialOrientationFilter?: "all" | "landscape" | "portrait" | "square"
  initialUsageFilter?: "all" | "used" | "unused"
  initialSortBy?: MediaSortOption
  initialPage?: number
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const assetsPerPage = 12
  const [assets, setAssets] = useState(initialAssets)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [warning, setWarning] = useState(initialWarning)
  const [canUpload, setCanUpload] = useState(initialCanUpload)
  const [keyword, setKeyword] = useState(initialKeyword)
  const [timeFilter, setTimeFilter] = useState<"all" | "7d" | "30d">(initialTimeFilter)
  const [storageFilter, setStorageFilter] = useState<"all" | "blob" | "local">(initialStorageFilter)
  const [orientationFilter, setOrientationFilter] = useState<"all" | "landscape" | "portrait" | "square">(initialOrientationFilter)
  const [usageFilter, setUsageFilter] = useState<"all" | "used" | "unused">(initialUsageFilter)
  const [sortBy, setSortBy] = useState<MediaSortOption>(initialSortBy)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [referenceNow, setReferenceNow] = useState(() => Date.now())
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const uploadHint = getMediaUploadHint()

  useEffect(() => {
    if (typeof window === "undefined") return

    const nextParams = new URLSearchParams()
    const normalizedKeyword = keyword.trim()
    if (normalizedKeyword) nextParams.set("q", normalizedKeyword)
    if (timeFilter !== "all") nextParams.set("time", timeFilter)
    if (storageFilter !== "all") nextParams.set("storage", storageFilter)
    if (orientationFilter !== "all") nextParams.set("orientation", orientationFilter)
    if (usageFilter !== "all") nextParams.set("usage", usageFilter)
    if (sortBy !== "newest") nextParams.set("sort", sortBy)
    if (currentPage > 1) nextParams.set("page", String(currentPage))

    const currentNormalized = new URLSearchParams(window.location.search).toString()
    const nextNormalized = nextParams.toString()

    if (currentNormalized === nextNormalized) return

    const nextUrl = nextNormalized ? `${window.location.pathname}?${nextNormalized}` : window.location.pathname
    window.history.replaceState(null, "", nextUrl)
  }, [currentPage, keyword, orientationFilter, sortBy, storageFilter, timeFilter, usageFilter])

  const refreshAssets = async () => {
    const response = await fetch("/api/admin/media", { cache: "no-store" })
    const data = await response.json()
    setAssets(Array.isArray(data.assets) ? data.assets : [])
    setWarning(typeof data.warning === "string" ? data.warning : null)
    setCanUpload(Boolean(data.canUpload))
    setReferenceNow(Date.now())
    setSelectedAssetIds((current) => current.filter((id) => Array.isArray(data.assets) && data.assets.some((asset: MediaAsset) => asset.id === id)))
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

        const response = await fetch("/api/admin/media", { method: "POST", body: formData })
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

      if (uploadedAssets.length > 0 || failures.length > 0) {
        setMessage(formatMediaUploadBatchMessage({ successCount: uploadedAssets.length, failures }))
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
    if (!confirm(`确定删除素材 ${asset.name} 吗？`)) return
    setMessage("")
    try {
      const response = await fetch(`/api/admin/media?id=${encodeURIComponent(asset.id)}`, { method: "DELETE" })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || "删除失败")
        return
      }
      setAssets((current) => current.filter((item) => item.id !== asset.id))
      setSelectedAssetIds((current) => current.filter((id) => id !== asset.id))
      setMessage("素材已删除")
      setReferenceNow(Date.now())
    } catch {
      setMessage("删除失败，请重试")
    }
  }

  const filteredAssets = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    const nextAssets = assets.filter((asset) => {
      if (normalizedKeyword && !asset.name.toLowerCase().includes(normalizedKeyword)) {
        return false
      }

      if (storageFilter !== "all" && asset.storage !== storageFilter) {
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

      if (timeFilter === "all") return true
      const days = timeFilter === "7d" ? 7 : 30
      return referenceNow - new Date(asset.updatedAt).getTime() <= days * 24 * 60 * 60 * 1000
    })
    return sortMediaAssets(nextAssets, sortBy)
  }, [assets, keyword, orientationFilter, referenceNow, sortBy, storageFilter, timeFilter, usageFilter])
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / assetsPerPage))
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const visibleAssets = filteredAssets.slice(
    (safeCurrentPage - 1) * assetsPerPage,
    safeCurrentPage * assetsPerPage
  )
  const filteredSummary = useMemo(() => {
    const totalSize = filteredAssets.reduce((sum, asset) => sum + asset.size, 0)
    const blobCount = filteredAssets.filter((asset) => asset.storage === "blob").length
    const localCount = filteredAssets.filter((asset) => asset.storage === "local").length
    const landscapeCount = filteredAssets.filter((asset) => getMediaOrientation(asset.width, asset.height) === "landscape").length
    const portraitCount = filteredAssets.filter((asset) => getMediaOrientation(asset.width, asset.height) === "portrait").length
    const squareCount = filteredAssets.filter((asset) => getMediaOrientation(asset.width, asset.height) === "square").length
    const usedCount = filteredAssets.filter((asset) => (asset.usageCount ?? 0) > 0).length
    const unusedCount = filteredAssets.filter((asset) => (asset.usageCount ?? 0) === 0).length
    return {
      totalSize,
      blobCount,
      localCount,
      landscapeCount,
      portraitCount,
      squareCount,
      usedCount,
      unusedCount,
    }
  }, [filteredAssets])

  const selectedAssets = useMemo(
    () => assets.filter((asset) => selectedAssetIds.includes(asset.id)),
    [assets, selectedAssetIds]
  )
  const deletableSelectedAssets = useMemo(
    () => selectedAssets.filter((asset) => asset.deletable && (asset.usageCount ?? 0) === 0),
    [selectedAssets]
  )
  const selectedCount = selectedAssetIds.length
  const deletableSelectedCount = deletableSelectedAssets.length
  const hasActiveFilters =
    keyword.trim().length > 0 ||
    timeFilter !== "all" ||
    storageFilter !== "all" ||
    orientationFilter !== "all" ||
    usageFilter !== "all" ||
    sortBy !== "newest" ||
    safeCurrentPage > 1
  const allSelectableVisibleSelected =
    visibleAssets.length > 0 &&
    visibleAssets.every((asset) => selectedAssetIds.includes(asset.id))

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage)
    }
  }, [currentPage, safeCurrentPage])

  const toggleSelectedAsset = (assetId: string) => {
    setSelectedAssetIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId]
    )
  }

  const handleToggleSelectAllVisible = () => {
    const visibleIds = visibleAssets.map((asset) => asset.id)
    if (visibleIds.length === 0) return

    setSelectedAssetIds((current) => {
      if (visibleIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleIds.includes(id))
      }
      return [...new Set([...current, ...visibleIds])]
    })
  }

  const handleCopySelected = async (format: "url" | "markdown" | "html", label: string) => {
    if (selectedAssets.length === 0) return
    try {
      await navigator.clipboard.writeText(buildMediaAssetBatchText(selectedAssets, format))
      setMessage(`已复制 ${selectedAssets.length} 项${label}`)
    } catch {
      setMessage("复制失败，请重试")
    }
  }

  const handleDeleteSelected = async () => {
    if (deletableSelectedAssets.length === 0) return
    if (!confirm(`确定删除已选中的 ${deletableSelectedAssets.length} 张素材吗？`)) return

    setMessage("")
    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: deletableSelectedAssets.map((asset) => asset.id) }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || "批量删除失败")
        return
      }

      const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : []
      const blockedIds = Array.isArray(data.blockedIds) ? data.blockedIds : []
      const failedIds = Array.isArray(data.failedIds) ? data.failedIds : []
      const missingIds = Array.isArray(data.missingIds) ? data.missingIds : []

      setAssets((current) => current.filter((asset) => !deletedIds.includes(asset.id)))
      setSelectedAssetIds((current) => current.filter((id) => !deletedIds.includes(id)))

      const skippedCount = selectedCount - deletableSelectedAssets.length
      if (failedIds.length > 0 || missingIds.length > 0 || skippedCount > 0 || blockedIds.length > 0) {
        setMessage(
          `已删除 ${deletedIds.length} 张素材，${failedIds.length + missingIds.length + skippedCount + blockedIds.length} 张未处理`
        )
      } else {
        setMessage(`已删除 ${deletedIds.length} 张素材`)
      }
      setReferenceNow(Date.now())
    } catch {
      setMessage("批量删除失败，请重试")
    }
  }

  const copyValue = async (value: string, label: string) => {
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
    setOrientationFilter("all")
    setUsageFilter("all")
    setSortBy("newest")
    setCurrentPage(1)
  }

  return (
    <SectionPageShell
      navLabel="媒体库"
      activeNav="media"
      brandLabel={brandName}
      title="站内媒体素材"
      description="集中管理文章中要复用的图片素材。"
      headerActions={
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setCurrentPage(1)
              }}
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
                  onClick={() => {
                    setTimeFilter(value as "all" | "7d" | "30d")
                    setCurrentPage(1)
                  }}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    timeFilter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={storageFilter}
              onChange={(event) => {
                setStorageFilter(event.target.value as "all" | "blob" | "local")
                setCurrentPage(1)
              }}
              className="rounded-xl border border-border/50 bg-card px-3 py-2 text-sm"
            >
              <option value="all">全部来源</option>
              <option value="blob">仅 Blob</option>
              <option value="local">仅本地</option>
            </select>
            <select
              value={orientationFilter}
              onChange={(event) => {
                setOrientationFilter(event.target.value as "all" | "landscape" | "portrait" | "square")
                setCurrentPage(1)
              }}
              className="rounded-xl border border-border/50 bg-card px-3 py-2 text-sm"
            >
              <option value="all">全部形态</option>
              <option value="landscape">横图</option>
              <option value="portrait">竖图</option>
              <option value="square">方图</option>
            </select>
            <select
              value={usageFilter}
              onChange={(event) => {
                setUsageFilter(event.target.value as "all" | "used" | "unused")
                setCurrentPage(1)
              }}
              className="rounded-xl border border-border/50 bg-card px-3 py-2 text-sm"
            >
              <option value="all">全部使用状态</option>
              <option value="used">仅使用中</option>
              <option value="unused">仅未使用</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as MediaSortOption)
                setCurrentPage(1)
              }}
              className="rounded-xl border border-border/50 bg-card px-3 py-2 text-sm"
            >
              <option value="newest">最新优先</option>
              <option value="oldest">最旧优先</option>
              <option value="largest">文件最大</option>
              <option value="smallest">文件最小</option>
              <option value="most-used">引用最多</option>
              <option value="least-used">引用最少</option>
              <option value="name-asc">名称 A-Z</option>
              <option value="name-desc">名称 Z-A</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => handleCopySelected("url", "个素材链接")}
                  className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
                >
                  复制已选链接
                </button>
                <button
                  type="button"
                  onClick={() => handleCopySelected("markdown", "个 Markdown")}
                  className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
                >
                  复制已选 Markdown
                </button>
                <button
                  type="button"
                  onClick={() => handleCopySelected("html", "个 HTML 片段")}
                  className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
                >
                  复制已选 HTML
                </button>
              </>
            ) : null}
            {deletableSelectedCount > 0 ? (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
              >
                删除可删 {deletableSelectedCount} 项
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canUpload}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!canUpload ? "请先配置 Blob" : isUploading ? "上传中..." : "上传图片"}
            </button>
            <button
              type="button"
              onClick={refreshAssets}
              className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
            >
              刷新
            </button>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
              >
                重置筛选
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground sm:basis-full sm:text-right">{uploadHint}</p>
        </>
      }
    >
      {message ? <p className="mb-4 text-sm text-primary">{message}</p> : null}
      {warning ? <p className="mb-4 text-sm text-amber-600">{warning}</p> : null}
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
      <MediaUploadDropzone
        canUpload={canUpload}
        isUploading={isUploading}
        hint={uploadHint}
        onSelectFiles={handleUploads}
        className="mb-4"
        compact
      />
      <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          {selectedCount > 0
            ? `已选中 ${selectedCount} 张素材${deletableSelectedCount < selectedCount ? `，其中 ${deletableSelectedCount} 张可删除` : ""}`
            : `筛选结果共 ${filteredAssets.length} 张素材，当前第 ${safeCurrentPage} / ${totalPages} 页`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSelectAllVisible}
            disabled={visibleAssets.length === 0}
            className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allSelectableVisibleSelected ? "取消全选可见项" : "全选可见项"}
          </button>
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedAssetIds([])}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
            >
              清空选择
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">素材总数</p>
          <p className="mt-2 text-2xl font-semibold">{filteredAssets.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">当前筛选结果</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">来源分布</p>
          <p className="mt-2 text-2xl font-semibold">{filteredSummary.blobCount} / {filteredSummary.localCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Blob / 本地</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">形态分布</p>
          <p className="mt-2 text-2xl font-semibold">{filteredSummary.landscapeCount} / {filteredSummary.portraitCount} / {filteredSummary.squareCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">横图 / 竖图 / 方图</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">使用情况</p>
          <p className="mt-2 text-2xl font-semibold">{filteredSummary.usedCount} / {filteredSummary.unusedCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">使用中 / 未使用</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">总体积</p>
          <p className="mt-2 text-2xl font-semibold">{formatSize(filteredSummary.totalSize)}</p>
          <p className="mt-1 text-xs text-muted-foreground">当前筛选结果</p>
        </div>
      </div>

      {visibleAssets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleAssets.map((asset) => (
            <div
              key={asset.id}
              className={`rounded-2xl border bg-card p-3 transition-colors ${
                selectedAssetIds.includes(asset.id) ? "border-primary/50 ring-1 ring-primary/20" : "border-border/50"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedAssetIds.includes(asset.id)}
                    onChange={() => toggleSelectedAsset(asset.id)}
                  />
                  {asset.deletable ? "选中素材" : "只读素材，可复制不可删除"}
                </label>
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {asset.storage === "blob" ? "Blob" : "本地"}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-border/40">
                <img src={asset.url} alt={asset.name} className="h-52 w-full object-cover" />
              </div>
              <div className="mt-3 space-y-1">
                <p className="truncate text-sm font-medium">{asset.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(asset.size)}
                  {formatDimensions(asset.width, asset.height) ? ` · ${formatDimensions(asset.width, asset.height)}` : ""}
                  {" · "}
                  {new Date(asset.updatedAt).toLocaleString("zh-CN")}
                  {typeof asset.usageCount === "number" ? ` · 使用于 ${asset.usageCount} 篇文章` : ""}
                </p>
                {asset.usagePosts && asset.usagePosts.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {asset.usagePosts.slice(0, 2).map((usage) => (
                      <Link
                        key={`${asset.id}-${usage.postId}-${usage.kind}`}
                        href={getMediaUsageHref(usage)}
                        className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {usage.draft ? "草稿" : "文章"} · {formatUsageKind(usage.kind)} · {usage.postTitle}
                      </Link>
                    ))}
                    {asset.usagePosts.length > 2 ? (
                      <span className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                        另 {asset.usagePosts.length - 2} 篇
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="pt-1 text-[11px] text-muted-foreground">当前还没有文章引用这张图</p>
                )}
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
                  disabled={!asset.deletable || (asset.usageCount ?? 0) > 0}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {(asset.usageCount ?? 0) > 0 ? "使用中" : "删除"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAssets.length > 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
          当前页没有素材，试试切换页码。
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
      {filteredAssets.length > assetsPerPage ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safeCurrentPage === 1}
            className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-muted-foreground">
            第 {safeCurrentPage} / {totalPages} 页
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={safeCurrentPage === totalPages}
            className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      ) : null}
    </SectionPageShell>
  )
}
