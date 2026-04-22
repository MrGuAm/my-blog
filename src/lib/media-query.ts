import type { MediaFormatFilter, MediaSortOption } from "@/lib/media-upload"

export interface MediaQueryState {
  keyword: string
  timeFilter: "all" | "7d" | "30d"
  storageFilter: "all" | "blob" | "local"
  formatFilter: MediaFormatFilter
  orientationFilter: "all" | "landscape" | "portrait" | "square"
  usageFilter: "all" | "used" | "unused"
  usageKindFilter: "all" | "cover" | "content" | "mixed"
  sortBy: MediaSortOption
  currentPage: number
}

const MEDIA_TIME_FILTERS = new Set<MediaQueryState["timeFilter"]>(["all", "7d", "30d"])
const MEDIA_STORAGE_FILTERS = new Set<MediaQueryState["storageFilter"]>(["all", "blob", "local"])
const MEDIA_FORMAT_FILTERS = new Set<MediaQueryState["formatFilter"]>(["all", "webp", "svg", "gif", "png", "jpeg", "other"])
const MEDIA_ORIENTATION_FILTERS = new Set<MediaQueryState["orientationFilter"]>(["all", "landscape", "portrait", "square"])
const MEDIA_USAGE_FILTERS = new Set<MediaQueryState["usageFilter"]>(["all", "used", "unused"])
const MEDIA_USAGE_KIND_FILTERS = new Set<MediaQueryState["usageKindFilter"]>(["all", "cover", "content", "mixed"])
const MEDIA_SORT_OPTIONS = new Set<MediaSortOption>([
  "newest",
  "oldest",
  "largest",
  "smallest",
  "most-used",
  "least-used",
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

export function buildMediaQueryString(state: MediaQueryState) {
  const params = new URLSearchParams()
  const normalizedKeyword = state.keyword.trim()

  if (normalizedKeyword) params.set("q", normalizedKeyword)
  if (state.timeFilter !== "all") params.set("time", state.timeFilter)
  if (state.storageFilter !== "all") params.set("storage", state.storageFilter)
  if (state.formatFilter !== "all") params.set("format", state.formatFilter)
  if (state.orientationFilter !== "all") params.set("orientation", state.orientationFilter)
  if (state.usageFilter !== "all") params.set("usage", state.usageFilter)
  if (state.usageKindFilter !== "all") params.set("kind", state.usageKindFilter)
  if (state.sortBy !== "newest") params.set("sort", state.sortBy)
  if (state.currentPage > 1) params.set("page", String(state.currentPage))

  return params.toString()
}

export function parseMediaQueryState(params?: Record<string, string | string[] | undefined>): MediaQueryState {
  const source = params || {}
  const keyword = getSingleParam(source.q)?.trim() || ""
  const timeParam = getSingleParam(source.time)?.trim() || "all"
  const storageParam = getSingleParam(source.storage)?.trim() || "all"
  const formatParam = getSingleParam(source.format)?.trim() || "all"
  const orientationParam = getSingleParam(source.orientation)?.trim() || "all"
  const usageParam = getSingleParam(source.usage)?.trim() || "all"
  const kindParam = getSingleParam(source.kind)?.trim() || "all"
  const sortParam = getSingleParam(source.sort)?.trim() || "newest"

  return {
    keyword,
    timeFilter: MEDIA_TIME_FILTERS.has(timeParam as MediaQueryState["timeFilter"])
      ? (timeParam as MediaQueryState["timeFilter"])
      : "all",
    storageFilter: MEDIA_STORAGE_FILTERS.has(storageParam as MediaQueryState["storageFilter"])
      ? (storageParam as MediaQueryState["storageFilter"])
      : "all",
    formatFilter: MEDIA_FORMAT_FILTERS.has(formatParam as MediaQueryState["formatFilter"])
      ? (formatParam as MediaQueryState["formatFilter"])
      : "all",
    orientationFilter: MEDIA_ORIENTATION_FILTERS.has(orientationParam as MediaQueryState["orientationFilter"])
      ? (orientationParam as MediaQueryState["orientationFilter"])
      : "all",
    usageFilter: MEDIA_USAGE_FILTERS.has(usageParam as MediaQueryState["usageFilter"])
      ? (usageParam as MediaQueryState["usageFilter"])
      : "all",
    usageKindFilter: MEDIA_USAGE_KIND_FILTERS.has(kindParam as MediaQueryState["usageKindFilter"])
      ? (kindParam as MediaQueryState["usageKindFilter"])
      : "all",
    sortBy: MEDIA_SORT_OPTIONS.has(sortParam as MediaSortOption)
      ? (sortParam as MediaSortOption)
      : "newest",
    currentPage: normalizePage(source.page),
  }
}
