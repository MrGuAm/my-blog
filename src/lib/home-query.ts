export interface HomeQueryState {
  searchQuery: string
  selectedTag: string | null
  currentPage: number
  showDrafts: boolean
  loginRequested: boolean
  nextPath: string | null
}

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] || null : value || null
}

function getSafeNextPath(value?: string | string[]) {
  const next = getSingleParam(value)
  if (!next) return null
  return next.startsWith("/") && !next.startsWith("//") ? next : null
}

function normalizePage(value?: string | string[]) {
  const next = Number(getSingleParam(value))
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : 1
}

export function parseHomeQueryState(params?: Record<string, string | string[] | undefined>): HomeQueryState {
  const source = params || {}
  const query = getSingleParam(source.q)?.trim() || ""
  const tag = getSingleParam(source.tag)?.trim() || null
  const drafts = getSingleParam(source.drafts) === "1"

  return {
    searchQuery: query,
    selectedTag: tag,
    currentPage: normalizePage(source.page),
    showDrafts: drafts,
    loginRequested: getSingleParam(source.login) === "1",
    nextPath: getSafeNextPath(source.next),
  }
}
