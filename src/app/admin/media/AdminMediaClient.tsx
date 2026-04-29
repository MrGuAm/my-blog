"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import MediaAssetCard from "@/components/MediaAssetCard"
import MediaAdminHeaderActions from "@/components/MediaAdminHeaderActions"
import MediaAssetPreviewDialog from "@/components/MediaAssetPreviewDialog"
import MediaCollectionEmptyState from "@/components/MediaCollectionEmptyState"
import MediaPaginationControls from "@/components/MediaPaginationControls"
import MediaSelectionToolbar from "@/components/MediaSelectionToolbar"
import MediaSummaryCards from "@/components/MediaSummaryCards"
import MediaUploadDropzone from "@/components/MediaUploadDropzone"
import SectionPageShell from "@/components/SectionPageShell"
import {
  buildMediaAssetCsv,
  buildMediaAssetBatchText,
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
import { buildMediaQueryString } from "@/lib/media-query"
import type { MediaAsset } from "@/lib/server/media"
import { getMediaUsageScope } from "@/lib/media-usage"

function formatCsvUsageScope(scope: "unused" | "cover" | "content" | "mixed") {
  if (scope === "cover") return "封面相关"
  if (scope === "content") return "正文相关"
  if (scope === "mixed") return "封面+正文"
  return "未使用"
}

export default function AdminMediaClient({
  initialAssets,
  initialWarning = null,
  initialCanUpload = true,
  brandName,
  embedded = false,
  initialKeyword = "",
  initialTimeFilter = "all",
  initialStorageFilter = "all",
  initialFormatFilter = "all",
  initialOrientationFilter = "all",
  initialUsageFilter = "all",
  initialUsageKindFilter = "all",
  initialSortBy = "newest",
  initialPage = 1,
}: {
  initialAssets: MediaAsset[]
  initialWarning?: string | null
  initialCanUpload?: boolean
  brandName: string
  embedded?: boolean
  initialKeyword?: string
  initialTimeFilter?: "all" | "7d" | "30d"
  initialStorageFilter?: "all" | "blob" | "local"
  initialFormatFilter?: MediaFormatFilter
  initialOrientationFilter?: "all" | "landscape" | "portrait" | "square"
  initialUsageFilter?: "all" | "used" | "unused"
  initialUsageKindFilter?: "all" | "cover" | "content" | "mixed"
  initialSortBy?: MediaSortOption
  initialPage?: number
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const assetsPerPage = 12
  const [assets, setAssets] = useState(initialAssets)
  const [isUploading, setIsUploading] = useState(false)
  const [isReindexing, setIsReindexing] = useState(false)
  const [message, setMessage] = useState("")
  const [warning, setWarning] = useState(initialWarning)
  const [canUpload, setCanUpload] = useState(initialCanUpload)
  const [keyword, setKeyword] = useState(initialKeyword)
  const [timeFilter, setTimeFilter] = useState<"all" | "7d" | "30d">(initialTimeFilter)
  const [storageFilter, setStorageFilter] = useState<"all" | "blob" | "local">(initialStorageFilter)
  const [formatFilter, setFormatFilter] = useState<MediaFormatFilter>(initialFormatFilter)
  const [orientationFilter, setOrientationFilter] = useState<"all" | "landscape" | "portrait" | "square">(initialOrientationFilter)
  const [usageFilter, setUsageFilter] = useState<"all" | "used" | "unused">(initialUsageFilter)
  const [usageKindFilter, setUsageKindFilter] = useState<"all" | "cover" | "content" | "mixed">(initialUsageKindFilter)
  const [sortBy, setSortBy] = useState<MediaSortOption>(initialSortBy)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [referenceNow, setReferenceNow] = useState(() => Date.now())
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)
  const uploadHint = getMediaUploadHint()

  useEffect(() => {
    if (typeof window === "undefined") return

    const currentNormalized = new URLSearchParams(window.location.search).toString()
    const nextNormalized = buildMediaQueryString({
      keyword,
      timeFilter,
      storageFilter,
      formatFilter,
      orientationFilter,
      usageFilter,
      usageKindFilter,
      sortBy,
      currentPage,
    })

    if (currentNormalized === nextNormalized) return

    const nextUrl = nextNormalized ? `${window.location.pathname}?${nextNormalized}` : window.location.pathname
    window.history.replaceState(null, "", nextUrl)
  }, [currentPage, formatFilter, keyword, orientationFilter, sortBy, storageFilter, timeFilter, usageFilter, usageKindFilter])

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
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / assetsPerPage))
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const visibleAssets = filteredAssets.slice(
    (safeCurrentPage - 1) * assetsPerPage,
    safeCurrentPage * assetsPerPage
  )
  const previewIndex = previewAsset ? visibleAssets.findIndex((asset) => asset.id === previewAsset.id) : -1
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
    formatFilter !== "all" ||
    orientationFilter !== "all" ||
    usageFilter !== "all" ||
    usageKindFilter !== "all" ||
    sortBy !== "newest" ||
    safeCurrentPage > 1
  const allSelectableVisibleSelected =
    visibleAssets.length > 0 &&
    visibleAssets.every((asset) => selectedAssetIds.includes(asset.id))
  const visibleUnusedAssetIds = visibleAssets
    .filter((asset) => asset.deletable && (asset.usageCount ?? 0) === 0)
    .map((asset) => asset.id)
  const visibleUsedAssetIds = visibleAssets
    .filter((asset) => (asset.usageCount ?? 0) > 0)
    .map((asset) => asset.id)

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

  const handleInvertVisibleSelection = () => {
    const visibleIds = visibleAssets.map((asset) => asset.id)
    if (visibleIds.length === 0) return

    setSelectedAssetIds((current) => {
      const currentSet = new Set(current)
      const nextSet = new Set(current)

      for (const id of visibleIds) {
        if (currentSet.has(id)) {
          nextSet.delete(id)
        } else {
          nextSet.add(id)
        }
      }

      return [...nextSet]
    })
    setMessage(`已反选当前可见的 ${visibleIds.length} 项素材`)
  }

  const handleSelectVisibleUnused = () => {
    if (visibleUnusedAssetIds.length === 0) return
    setSelectedAssetIds((current) => [...new Set([...current, ...visibleUnusedAssetIds])])
    setMessage(`已选中当前可见的 ${visibleUnusedAssetIds.length} 张未使用素材`)
  }

  const handleSelectVisibleUsed = () => {
    if (visibleUsedAssetIds.length === 0) return
    setSelectedAssetIds((current) => [...new Set([...current, ...visibleUsedAssetIds])])
    setMessage(`已选中当前可见的 ${visibleUsedAssetIds.length} 张使用中素材`)
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

  const handleCopyFiltered = async (format: "url" | "markdown" | "html", label: string) => {
    if (filteredAssets.length === 0) return
    try {
      await navigator.clipboard.writeText(buildMediaAssetBatchText(filteredAssets, format))
      setMessage(`已复制当前筛选结果 ${filteredAssets.length} 项${label}`)
    } catch {
      setMessage("复制失败，请重试")
    }
  }

  const handleCopyCurrentViewLink = async () => {
    if (typeof window === "undefined") return
    try {
      const query = buildMediaQueryString({
        keyword,
        timeFilter,
        storageFilter,
        formatFilter,
        orientationFilter,
        usageFilter,
        usageKindFilter,
        sortBy,
        currentPage,
      })
      const nextUrl = query ? `${window.location.origin}/admin/media?${query}` : `${window.location.origin}/admin/media`
      await navigator.clipboard.writeText(nextUrl)
      setMessage("当前筛选视图链接已复制")
    } catch {
      setMessage("复制失败，请重试")
    }
  }

  const handleExportSelectedCsv = () => {
    if (selectedAssets.length === 0 || typeof window === "undefined") return

    const csv = buildMediaAssetCsv(
      selectedAssets.map((asset) => ({
        ...asset,
        usageScope: formatCsvUsageScope(getMediaUsageScope(asset.usagePosts)),
        usageTitles: asset.usagePosts?.map((usage) => usage.postTitle).join(" | ") || "",
      }))
    )
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `media-selection-${Date.now()}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
    setMessage(`已导出 ${selectedAssets.length} 项素材 CSV`)
  }

  const handleExportFilteredCsv = () => {
    if (filteredAssets.length === 0 || typeof window === "undefined") return

    const csv = buildMediaAssetCsv(
      filteredAssets.map((asset) => ({
        ...asset,
        usageScope: formatCsvUsageScope(getMediaUsageScope(asset.usagePosts)),
        usageTitles: asset.usagePosts?.map((usage) => usage.postTitle).join(" | ") || "",
      }))
    )
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `media-filtered-${Date.now()}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
    setMessage(`已导出当前筛选结果，共 ${filteredAssets.length} 项素材`)
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

  const handleReindexUsage = async () => {
    setIsReindexing(true)
    setMessage("")
    try {
      const response = await fetch("/api/admin/media/reindex", { method: "POST" })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || "重建引用索引失败")
        return
      }
      await refreshAssets()
      setMessage(`引用索引已重建：扫描 ${data.postCount ?? 0} 篇文章，记录 ${data.referenceCount ?? 0} 条引用`)
    } catch {
      setMessage("重建引用索引失败，请重试")
    } finally {
      setIsReindexing(false)
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
    setCurrentPage(1)
  }

  const content = (
    <>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold">图片素材</h2>
          <p className="mt-1 text-sm text-muted-foreground">集中管理文章中要复用的封面图、插图和历史图片素材。</p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <MediaAdminHeaderActions
            keyword={keyword}
            onKeywordChange={(value) => {
              setKeyword(value)
              setCurrentPage(1)
            }}
            timeFilter={timeFilter}
            onTimeFilterChange={(value) => {
              setTimeFilter(value)
              setCurrentPage(1)
            }}
            storageFilter={storageFilter}
            onStorageFilterChange={(value) => {
              setStorageFilter(value)
              setCurrentPage(1)
            }}
            formatFilter={formatFilter}
            onFormatFilterChange={(value) => {
              setFormatFilter(value)
              setCurrentPage(1)
            }}
            orientationFilter={orientationFilter}
            onOrientationFilterChange={(value) => {
              setOrientationFilter(value)
              setCurrentPage(1)
            }}
            usageFilter={usageFilter}
            onUsageFilterChange={(value) => {
              setUsageFilter(value)
              setCurrentPage(1)
            }}
            usageKindFilter={usageKindFilter}
            onUsageKindFilterChange={(value) => {
              setUsageKindFilter(value)
              setCurrentPage(1)
            }}
            sortBy={sortBy}
            onSortByChange={(value) => {
              setSortBy(value)
              setCurrentPage(1)
            }}
            showReset={hasActiveFilters}
            onReset={resetFilters}
            selectedCount={selectedCount}
            deletableSelectedCount={deletableSelectedCount}
            filteredCount={filteredAssets.length}
            canUpload={canUpload}
            isUploading={isUploading}
            isReindexing={isReindexing}
            uploadHint={uploadHint}
            onCopySelected={handleCopySelected}
            onExportSelectedCsv={handleExportSelectedCsv}
            onDeleteSelected={handleDeleteSelected}
            onOpenUploadPicker={() => fileInputRef.current?.click()}
            onRefresh={refreshAssets}
            onCopyCurrentViewLink={handleCopyCurrentViewLink}
            onCopyFiltered={handleCopyFiltered}
            onExportFilteredCsv={handleExportFilteredCsv}
            onReindexUsage={handleReindexUsage}
          />
        </div>
      </div>

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
      <MediaSelectionToolbar
        selectedCount={selectedCount}
        deletableSelectedCount={deletableSelectedCount}
        filteredCount={filteredAssets.length}
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        visibleCount={visibleAssets.length}
        visibleUnusedCount={visibleUnusedAssetIds.length}
        visibleUsedCount={visibleUsedAssetIds.length}
        allSelectableVisibleSelected={allSelectableVisibleSelected}
        onToggleSelectAllVisible={handleToggleSelectAllVisible}
        onInvertVisibleSelection={handleInvertVisibleSelection}
        onSelectVisibleUnused={handleSelectVisibleUnused}
        onSelectVisibleUsed={handleSelectVisibleUsed}
        onClearSelection={() => setSelectedAssetIds([])}
      />

      <MediaSummaryCards
        filteredCount={filteredAssets.length}
        summary={filteredSummary}
        storageFilter={storageFilter}
        orientationFilter={orientationFilter}
        usageFilter={usageFilter}
        onStorageFilterChange={(value) => {
          setStorageFilter(value)
          setCurrentPage(1)
        }}
        onOrientationFilterChange={(value) => {
          setOrientationFilter(value)
          setCurrentPage(1)
        }}
        onUsageFilterChange={(value) => {
          setUsageFilter(value)
          setCurrentPage(1)
        }}
      />

      {visibleAssets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleAssets.map((asset) => (
            <MediaAssetCard
              key={asset.id}
              asset={asset}
              onPreview={() => setPreviewAsset(asset)}
              openUsageInNewTab={false}
              className={`rounded-2xl border bg-card p-3 transition-colors ${
                selectedAssetIds.includes(asset.id) ? "border-primary/50 ring-1 ring-primary/20" : "border-border/50"
              }`}
              topBar={
                <div className="flex items-center justify-between gap-3">
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
              }
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
      ) : filteredAssets.length > 0 ? (
        <MediaCollectionEmptyState message="当前页没有素材，试试切换页码。" />
      ) : assets.length > 0 ? (
        <MediaCollectionEmptyState message="当前筛选条件下没有素材，换个关键词或时间范围试试。" />
      ) : (
        <MediaCollectionEmptyState message="还没有任何素材，先上传一张图片试试。" />
      )}
      <MediaPaginationControls
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
        onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
      />
      <MediaAssetPreviewDialog
        key={previewAsset?.id || "media-preview"}
        asset={previewAsset}
        isOpen={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        onPrevious={
          previewIndex > 0
            ? () => setPreviewAsset(visibleAssets[previewIndex - 1] ?? null)
            : null
        }
        onNext={
          previewIndex >= 0 && previewIndex < visibleAssets.length - 1
            ? () => setPreviewAsset(visibleAssets[previewIndex + 1] ?? null)
            : null
        }
        hasPrevious={previewIndex > 0}
        hasNext={previewIndex >= 0 && previewIndex < visibleAssets.length - 1}
        positionLabel={previewIndex >= 0 ? `${previewIndex + 1} / ${visibleAssets.length}` : undefined}
        thumbnailAssets={visibleAssets}
        onJumpToAsset={(asset) => setPreviewAsset(asset)}
      />
    </>
  )

  if (embedded) {
    return content
  }

  return (
    <SectionPageShell
      navLabel="媒体库"
      activeNav="media"
      brandLabel={brandName}
      title="站内媒体素材"
      description="集中管理文章中要复用的图片素材。"
    >
      {content}
    </SectionPageShell>
  )
}
