"use client"

export interface MediaSummarySnapshot {
  totalSize: number
  blobCount: number
  localCount: number
  landscapeCount: number
  portraitCount: number
  squareCount: number
  usedCount: number
  unusedCount: number
}

interface MediaSummaryCardsProps {
  filteredCount: number
  summary: MediaSummarySnapshot
  storageFilter: "all" | "blob" | "local"
  orientationFilter: "all" | "landscape" | "portrait" | "square"
  usageFilter: "all" | "used" | "unused"
  onStorageFilterChange: (value: "blob" | "local") => void
  onOrientationFilterChange: (value: "landscape" | "portrait" | "square") => void
  onUsageFilterChange: (value: "used" | "unused") => void
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function summaryFilterButtonClass(active: boolean) {
  return `rounded-full px-2.5 py-1 text-[11px] transition-colors ${
    active
      ? "bg-primary text-primary-foreground"
      : "border border-border/60 text-muted-foreground hover:bg-accent"
  }`
}

export default function MediaSummaryCards({
  filteredCount,
  summary,
  storageFilter,
  orientationFilter,
  usageFilter,
  onStorageFilterChange,
  onOrientationFilterChange,
  onUsageFilterChange,
}: MediaSummaryCardsProps) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">素材总数</p>
        <p className="mt-2 text-2xl font-semibold">{filteredCount}</p>
        <p className="mt-1 text-xs text-muted-foreground">当前筛选结果</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">来源分布</p>
        <p className="mt-2 text-2xl font-semibold">{summary.blobCount} / {summary.localCount}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onStorageFilterChange("blob")}
            className={summaryFilterButtonClass(storageFilter === "blob")}
          >
            Blob
          </button>
          <button
            type="button"
            onClick={() => onStorageFilterChange("local")}
            className={summaryFilterButtonClass(storageFilter === "local")}
          >
            本地
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">形态分布</p>
        <p className="mt-2 text-2xl font-semibold">{summary.landscapeCount} / {summary.portraitCount} / {summary.squareCount}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOrientationFilterChange("landscape")}
            className={summaryFilterButtonClass(orientationFilter === "landscape")}
          >
            横图
          </button>
          <button
            type="button"
            onClick={() => onOrientationFilterChange("portrait")}
            className={summaryFilterButtonClass(orientationFilter === "portrait")}
          >
            竖图
          </button>
          <button
            type="button"
            onClick={() => onOrientationFilterChange("square")}
            className={summaryFilterButtonClass(orientationFilter === "square")}
          >
            方图
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">使用情况</p>
        <p className="mt-2 text-2xl font-semibold">{summary.usedCount} / {summary.unusedCount}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onUsageFilterChange("used")}
            className={summaryFilterButtonClass(usageFilter === "used")}
          >
            使用中
          </button>
          <button
            type="button"
            onClick={() => onUsageFilterChange("unused")}
            className={summaryFilterButtonClass(usageFilter === "unused")}
          >
            未使用
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">总体积</p>
        <p className="mt-2 text-2xl font-semibold">{formatSize(summary.totalSize)}</p>
        <p className="mt-1 text-xs text-muted-foreground">当前筛选结果</p>
      </div>
    </div>
  )
}
