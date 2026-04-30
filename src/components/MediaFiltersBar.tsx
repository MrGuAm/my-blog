"use client"

import type { MediaFormatFilter, MediaSortOption } from "@/lib/media-upload"
import { getActiveMediaFilterChips } from "@/lib/media-filters"

interface MediaFiltersBarProps {
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
  showSortSelect?: boolean
  controlClassName?: string
  searchClassName?: string
  showReset?: boolean
  onReset?: () => void
}

const timeFilters: Array<{ value: "all" | "7d" | "30d"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "7d", label: "7 天内" },
  { value: "30d", label: "30 天内" },
]

export default function MediaFiltersBar({
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
  showSortSelect = true,
  controlClassName = "rounded-xl border border-border/50 bg-card px-3 py-2 text-sm",
  searchClassName = "w-full rounded-xl border border-border/50 bg-card px-3 py-2 text-sm sm:w-64",
  showReset = false,
  onReset,
}: MediaFiltersBarProps) {
  const activeChips = getActiveMediaFilterChips({
    keyword,
    timeFilter,
    storageFilter,
    formatFilter,
    orientationFilter,
    usageFilter,
    usageKindFilter,
    sortBy,
  })

  const handleRemoveChip = (key: ReturnType<typeof getActiveMediaFilterChips>[number]["key"]) => {
    if (key === "keyword") onKeywordChange("")
    if (key === "timeFilter") onTimeFilterChange("all")
    if (key === "storageFilter") onStorageFilterChange("all")
    if (key === "formatFilter") onFormatFilterChange("all")
    if (key === "orientationFilter") onOrientationFilterChange("all")
    if (key === "usageFilter") onUsageFilterChange("all")
    if (key === "usageKindFilter") onUsageKindFilterChange("all")
    if (key === "sortBy") onSortByChange("newest")
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <input
          type="text"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          aria-label="搜索素材名称"
          placeholder="搜索素材名称"
          className={searchClassName}
        />

        <div className="inline-flex rounded-full border border-border/50 bg-card p-1 text-sm">
          {timeFilters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onTimeFilterChange(value)}
              className={`rounded-full px-3 py-1 transition-colors ${
                timeFilter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={storageFilter}
          aria-label="媒体来源筛选"
          onChange={(event) => onStorageFilterChange(event.target.value as "all" | "blob" | "local")}
          className={controlClassName}
        >
          <option value="all">全部来源</option>
          <option value="blob">仅 Blob</option>
          <option value="local">仅本地</option>
        </select>

        <select
          value={formatFilter}
          aria-label="媒体格式筛选"
          onChange={(event) => onFormatFilterChange(event.target.value as MediaFormatFilter)}
          className={controlClassName}
        >
          <option value="all">全部格式</option>
          <option value="webp">WebP</option>
          <option value="svg">SVG</option>
          <option value="gif">GIF</option>
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
          <option value="other">其他</option>
        </select>

        <select
          value={orientationFilter}
          aria-label="媒体形态筛选"
          onChange={(event) => onOrientationFilterChange(event.target.value as "all" | "landscape" | "portrait" | "square")}
          className={controlClassName}
        >
          <option value="all">全部形态</option>
          <option value="landscape">横图</option>
          <option value="portrait">竖图</option>
          <option value="square">方图</option>
        </select>

        <select
          value={usageFilter}
          aria-label="媒体使用筛选"
          onChange={(event) => onUsageFilterChange(event.target.value as "all" | "used" | "unused")}
          className={controlClassName}
        >
          <option value="all">全部使用状态</option>
          <option value="used">仅使用中</option>
          <option value="unused">仅未使用</option>
        </select>

        <select
          value={usageKindFilter}
          aria-label="媒体用途筛选"
          onChange={(event) => onUsageKindFilterChange(event.target.value as "all" | "cover" | "content" | "mixed")}
          className={controlClassName}
        >
          <option value="all">全部用途</option>
          <option value="cover">仅封面相关</option>
          <option value="content">仅正文相关</option>
          <option value="mixed">封面+正文</option>
        </select>

        {showSortSelect ? (
          <select
            value={sortBy}
            aria-label="媒体排序"
            onChange={(event) => onSortByChange(event.target.value as MediaSortOption)}
            className={controlClassName}
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
        ) : null}
      </div>

      {showReset && onReset ? (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent"
          >
            重置筛选
          </button>
        </div>
      ) : null}

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">当前筛选</span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleRemoveChip(chip.key)}
              aria-label={`移除筛选 ${chip.label}`}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              <span>{chip.label}</span>
              <span aria-hidden="true" className="text-[11px]">
                ×
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
