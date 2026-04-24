export type SearchSortOption = "default" | "newest" | "oldest"
export type SearchViewMode = "cards" | "compact"

export interface SearchQueryState {
  searchQuery: string
  selectedTag: string | null
  selectedCategory: string | null
  currentPage: number
  sortBy: SearchSortOption
  viewMode: SearchViewMode
}

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] || null : value || null
}

function normalizePage(value?: string | string[]) {
  const next = Number(getSingleParam(value))
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : 1
}

export function parseSearchQueryState(params?: Record<string, string | string[] | undefined>): SearchQueryState {
  const source = params || {}
  const sort = getSingleParam(source.sort)?.trim() || "default"
  const view = getSingleParam(source.view)?.trim() || "cards"

  return {
    searchQuery: getSingleParam(source.q)?.trim() || "",
    selectedTag: getSingleParam(source.tag)?.trim() || null,
    selectedCategory: getSingleParam(source.category)?.trim() || null,
    currentPage: normalizePage(source.page),
    sortBy: sort === "newest" || sort === "oldest" ? sort : "default",
    viewMode: view === "compact" ? "compact" : "cards",
  }
}

export function buildSearchHref(state: SearchQueryState) {
  const params = new URLSearchParams()
  if (state.searchQuery.trim()) params.set("q", state.searchQuery.trim())
  if (state.selectedTag) params.set("tag", state.selectedTag)
  if (state.selectedCategory) params.set("category", state.selectedCategory)
  if (state.sortBy !== "default") params.set("sort", state.sortBy)
  if (state.viewMode !== "cards") params.set("view", state.viewMode)
  if (state.currentPage > 1) params.set("page", String(state.currentPage))
  const next = params.toString()
  return next ? `/search?${next}` : "/search"
}
