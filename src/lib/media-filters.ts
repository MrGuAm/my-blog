import type { MediaFormatFilter, MediaSortOption } from "@/lib/media-upload"

export interface MediaFilterState {
  keyword: string
  timeFilter: "all" | "7d" | "30d"
  storageFilter: "all" | "blob" | "local"
  formatFilter: MediaFormatFilter
  orientationFilter: "all" | "landscape" | "portrait" | "square"
  usageFilter: "all" | "used" | "unused"
  usageKindFilter: "all" | "cover" | "content" | "mixed"
  sortBy: MediaSortOption
}

export interface ActiveMediaFilterChip {
  key: "keyword" | "timeFilter" | "storageFilter" | "formatFilter" | "orientationFilter" | "usageFilter" | "usageKindFilter" | "sortBy"
  label: string
}

const timeFilterLabels: Record<Exclude<MediaFilterState["timeFilter"], "all">, string> = {
  "7d": "时间：7 天内",
  "30d": "时间：30 天内",
}

const storageFilterLabels: Record<Exclude<MediaFilterState["storageFilter"], "all">, string> = {
  blob: "来源：Blob",
  local: "来源：本地",
}

const formatFilterLabels: Record<Exclude<MediaFilterState["formatFilter"], "all">, string> = {
  webp: "格式：WebP",
  svg: "格式：SVG",
  gif: "格式：GIF",
  png: "格式：PNG",
  jpeg: "格式：JPEG",
  other: "格式：其他",
}

const orientationFilterLabels: Record<Exclude<MediaFilterState["orientationFilter"], "all">, string> = {
  landscape: "形态：横图",
  portrait: "形态：竖图",
  square: "形态：方图",
}

const usageFilterLabels: Record<Exclude<MediaFilterState["usageFilter"], "all">, string> = {
  used: "使用：使用中",
  unused: "使用：未使用",
}

const usageKindFilterLabels: Record<Exclude<MediaFilterState["usageKindFilter"], "all">, string> = {
  cover: "用途：封面相关",
  content: "用途：正文相关",
  mixed: "用途：封面+正文",
}

const sortOptionLabels: Record<Exclude<MediaSortOption, "newest">, string> = {
  oldest: "排序：最旧优先",
  largest: "排序：文件最大",
  smallest: "排序：文件最小",
  "most-used": "排序：引用最多",
  "least-used": "排序：引用最少",
  "name-asc": "排序：名称 A-Z",
  "name-desc": "排序：名称 Z-A",
}

export function getActiveMediaFilterChips(state: MediaFilterState): ActiveMediaFilterChip[] {
  const chips: ActiveMediaFilterChip[] = []
  const normalizedKeyword = state.keyword.trim()

  if (normalizedKeyword) {
    chips.push({ key: "keyword", label: `搜索：${normalizedKeyword}` })
  }

  if (state.timeFilter !== "all") {
    chips.push({ key: "timeFilter", label: timeFilterLabels[state.timeFilter] })
  }

  if (state.storageFilter !== "all") {
    chips.push({ key: "storageFilter", label: storageFilterLabels[state.storageFilter] })
  }

  if (state.formatFilter !== "all") {
    chips.push({ key: "formatFilter", label: formatFilterLabels[state.formatFilter] })
  }

  if (state.orientationFilter !== "all") {
    chips.push({ key: "orientationFilter", label: orientationFilterLabels[state.orientationFilter] })
  }

  if (state.usageFilter !== "all") {
    chips.push({ key: "usageFilter", label: usageFilterLabels[state.usageFilter] })
  }

  if (state.usageKindFilter !== "all") {
    chips.push({ key: "usageKindFilter", label: usageKindFilterLabels[state.usageKindFilter] })
  }

  if (state.sortBy !== "newest") {
    chips.push({ key: "sortBy", label: sortOptionLabels[state.sortBy] })
  }

  return chips
}
