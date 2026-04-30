"use client"

import MediaFiltersBar from "@/components/MediaFiltersBar"
import type { MediaFormatFilter, MediaSortOption } from "@/lib/media-upload"

interface MediaAdminHeaderActionsProps {
  keyword: string
  onKeywordChange: (value: string) => void
  timeFilter: "all" | "7d" | "30d"
  onTimeFilterChange: (value: "all" | "7d" | "30d") => void
  storageFilter: "all" | "blob" | "local"
  onStorageFilterChange: (value: "all" | "blob" | "local") => void
  formatFilter: MediaFormatFilter
  onFormatFilterChange: (value: MediaFormatFilter) => void
  orientationFilter: "all" | "landscape" | "portrait" | "square"
  onOrientationFilterChange: (value: "all" | "landscape" | "portrait" | "square") => void
  usageFilter: "all" | "used" | "unused"
  onUsageFilterChange: (value: "all" | "used" | "unused") => void
  usageKindFilter: "all" | "cover" | "content" | "mixed"
  onUsageKindFilterChange: (value: "all" | "cover" | "content" | "mixed") => void
  sortBy: MediaSortOption
  onSortByChange: (value: MediaSortOption) => void
  showReset: boolean
  onReset: () => void
  selectedCount: number
  deletableSelectedCount: number
  filteredCount: number
  canUpload: boolean
  isUploading: boolean
  isReindexing: boolean
  uploadHint: string
  onCopySelected: (format: "url" | "markdown" | "html", label: string) => void
  onExportSelectedCsv: () => void
  onDeleteSelected: () => void
  onOpenUploadPicker: () => void
  onRefresh: () => void
  onCopyCurrentViewLink: () => void
  onCopyFiltered: (format: "url" | "markdown" | "html", label: string) => void
  onExportFilteredCsv: () => void
  onReindexUsage: () => void
}

export default function MediaAdminHeaderActions({
  keyword,
  onKeywordChange,
  timeFilter,
  onTimeFilterChange,
  storageFilter,
  onStorageFilterChange,
  formatFilter,
  onFormatFilterChange,
  orientationFilter,
  onOrientationFilterChange,
  usageFilter,
  onUsageFilterChange,
  usageKindFilter,
  onUsageKindFilterChange,
  sortBy,
  onSortByChange,
  showReset,
  onReset,
  selectedCount,
  deletableSelectedCount,
  filteredCount,
  canUpload,
  isUploading,
  isReindexing,
  uploadHint,
  onCopySelected,
  onExportSelectedCsv,
  onDeleteSelected,
  onOpenUploadPicker,
  onRefresh,
  onCopyCurrentViewLink,
  onCopyFiltered,
  onExportFilteredCsv,
  onReindexUsage,
}: MediaAdminHeaderActionsProps) {
  return (
    <div className="w-full space-y-3">
      <MediaFiltersBar
        keyword={keyword}
        onKeywordChange={onKeywordChange}
        timeFilter={timeFilter}
        onTimeFilterChange={onTimeFilterChange}
        storageFilter={storageFilter}
        onStorageFilterChange={onStorageFilterChange}
        formatFilter={formatFilter}
        onFormatFilterChange={onFormatFilterChange}
        orientationFilter={orientationFilter}
        onOrientationFilterChange={onOrientationFilterChange}
        usageFilter={usageFilter}
        onUsageFilterChange={onUsageFilterChange}
        usageKindFilter={usageKindFilter}
        onUsageKindFilterChange={onUsageKindFilterChange}
        sortBy={sortBy}
        onSortByChange={onSortByChange}
        showReset={showReset}
        onReset={onReset}
      />
      <div className="flex flex-wrap items-center gap-3">
        {selectedCount > 0 ? (
          <>
            <button
              type="button"
              onClick={() => onCopySelected("url", "个素材链接")}
              className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
            >
              复制已选链接
            </button>
            <button
              type="button"
              onClick={() => onCopySelected("markdown", "个 Markdown")}
              className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
            >
              复制已选 Markdown
            </button>
            <button
              type="button"
              onClick={() => onCopySelected("html", "个 HTML 片段")}
              className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
            >
              复制已选 HTML
            </button>
            <button
              type="button"
              onClick={onExportSelectedCsv}
              className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
            >
              导出已选 CSV
            </button>
          </>
        ) : null}
        {deletableSelectedCount > 0 ? (
          <button
            type="button"
            onClick={onDeleteSelected}
            className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
          >
            删除可删 {deletableSelectedCount} 项
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenUploadPicker}
          disabled={!canUpload}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!canUpload ? "请先配置 Blob" : isUploading ? "上传中..." : "上传图片"}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
        >
          刷新
        </button>
        <button
          type="button"
          onClick={onCopyCurrentViewLink}
          className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
        >
          复制当前视图链接
        </button>
        <button
          type="button"
          onClick={() => onCopyFiltered("url", "素材链接")}
          disabled={filteredCount === 0}
          className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          复制筛选素材链接
        </button>
        <button
          type="button"
          onClick={() => onCopyFiltered("markdown", "个 Markdown")}
          disabled={filteredCount === 0}
          className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          复制筛选 Markdown
        </button>
        <button
          type="button"
          onClick={() => onCopyFiltered("html", "个 HTML 片段")}
          disabled={filteredCount === 0}
          className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          复制筛选 HTML
        </button>
        <button
          type="button"
          onClick={onExportFilteredCsv}
          disabled={filteredCount === 0}
          className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          导出筛选结果 CSV
        </button>
        <button
          type="button"
          onClick={onReindexUsage}
          disabled={isReindexing}
          className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isReindexing ? "重建中..." : "重建引用索引"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{uploadHint}</p>
    </div>
  )
}
