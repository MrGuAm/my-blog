const recentSearchesStorageKey = "champion-blog:recent-searches"
const recentSearchesLimit = 8

function canUseStorage() {
  return typeof window !== "undefined"
}

export function readRecentSearches() {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(recentSearchesStorageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : []
  } catch {
    return []
  }
}

export function writeRecentSearches(values: string[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(recentSearchesStorageKey, JSON.stringify(values.slice(0, recentSearchesLimit)))
}

export function pushRecentSearch(value: string) {
  const normalizedValue = value.trim()
  if (!normalizedValue) return []

  const nextValues = [
    normalizedValue,
    ...readRecentSearches().filter((item) => item.toLowerCase() !== normalizedValue.toLowerCase()),
  ].slice(0, recentSearchesLimit)

  writeRecentSearches(nextValues)
  return nextValues
}
