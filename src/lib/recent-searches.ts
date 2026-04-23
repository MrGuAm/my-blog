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

export function buildRecentSearches(values: string[], value: string) {
  const normalizedValue = value.trim()
  if (!normalizedValue) return values.slice(0, recentSearchesLimit)

  return [
    normalizedValue,
    ...values.filter((item) => item.toLowerCase() !== normalizedValue.toLowerCase()),
  ].slice(0, recentSearchesLimit)
}

export function pushRecentSearch(value: string) {
  const nextValues = buildRecentSearches(readRecentSearches(), value)

  writeRecentSearches(nextValues)
  return nextValues
}

export function removeRecentSearch(value: string) {
  const normalizedValue = value.trim().toLowerCase()
  if (!normalizedValue) return readRecentSearches()

  const nextValues = readRecentSearches().filter((item) => item.toLowerCase() !== normalizedValue)
  writeRecentSearches(nextValues)
  return nextValues
}

export function clearRecentSearches() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(recentSearchesStorageKey)
}
