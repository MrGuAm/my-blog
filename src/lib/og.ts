export function clampOgText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`
}

export function pickOgCategoryLabel(category?: string, series?: string) {
  if (series?.trim()) return `系列 · ${series.trim()}`
  if (category?.trim()) return category.trim()
  return "Champion's Blog"
}
