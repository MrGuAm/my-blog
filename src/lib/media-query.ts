import type { MediaSortOption } from "@/lib/media-upload"

export interface MediaQueryState {
  keyword: string
  timeFilter: "all" | "7d" | "30d"
  sortBy: MediaSortOption
}

const MEDIA_TIME_FILTERS = new Set<MediaQueryState["timeFilter"]>(["all", "7d", "30d"])
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

export function parseMediaQueryState(params?: Record<string, string | string[] | undefined>): MediaQueryState {
  const source = params || {}
  const keyword = getSingleParam(source.q)?.trim() || ""
  const timeParam = getSingleParam(source.time)?.trim() || "all"
  const sortParam = getSingleParam(source.sort)?.trim() || "newest"

  return {
    keyword,
    timeFilter: MEDIA_TIME_FILTERS.has(timeParam as MediaQueryState["timeFilter"])
      ? (timeParam as MediaQueryState["timeFilter"])
      : "all",
    sortBy: MEDIA_SORT_OPTIONS.has(sortParam as MediaSortOption)
      ? (sortParam as MediaSortOption)
      : "newest",
  }
}
