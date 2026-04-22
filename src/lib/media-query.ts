import type { MediaSortOption } from "@/lib/media-upload"

export interface MediaQueryState {
  keyword: string
  timeFilter: "all" | "7d" | "30d"
  storageFilter: "all" | "blob" | "local"
  sortBy: MediaSortOption
  currentPage: number
}

const MEDIA_TIME_FILTERS = new Set<MediaQueryState["timeFilter"]>(["all", "7d", "30d"])
const MEDIA_STORAGE_FILTERS = new Set<MediaQueryState["storageFilter"]>(["all", "blob", "local"])
const MEDIA_SORT_OPTIONS = new Set<MediaSortOption>([
  "newest",
  "oldest",
  "largest",
  "smallest",
  "name-asc",
  "name-desc",
])

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] || null : value || null
}

function normalizePage(value?: string | string[]) {
  const next = Number(getSingleParam(value))
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : 1
}

export function parseMediaQueryState(params?: Record<string, string | string[] | undefined>): MediaQueryState {
  const source = params || {}
  const keyword = getSingleParam(source.q)?.trim() || ""
  const timeParam = getSingleParam(source.time)?.trim() || "all"
  const storageParam = getSingleParam(source.storage)?.trim() || "all"
  const sortParam = getSingleParam(source.sort)?.trim() || "newest"

  return {
    keyword,
    timeFilter: MEDIA_TIME_FILTERS.has(timeParam as MediaQueryState["timeFilter"])
      ? (timeParam as MediaQueryState["timeFilter"])
      : "all",
    storageFilter: MEDIA_STORAGE_FILTERS.has(storageParam as MediaQueryState["storageFilter"])
      ? (storageParam as MediaQueryState["storageFilter"])
      : "all",
    sortBy: MEDIA_SORT_OPTIONS.has(sortParam as MediaSortOption)
      ? (sortParam as MediaSortOption)
      : "newest",
    currentPage: normalizePage(source.page),
  }
}
