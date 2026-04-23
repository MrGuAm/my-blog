import type { Post } from "@/lib/posts"
import type { SearchSortOption } from "@/lib/search-query"

export interface PostSearchState {
  searchQuery: string
  selectedTag: string | null
  selectedCategory?: string | null
  includeDrafts: boolean
}

export interface HighlightPart {
  text: string
  match: boolean
}

export interface PostSearchMatchScope {
  title: boolean
  excerpt: boolean
  category: boolean
  series: boolean
  tags: boolean
  content: boolean
}

export interface PostSearchSuggestion {
  type: "tag" | "series"
  value: string
}

export interface PostCategoryBreakdownItem {
  category: string
  count: number
}

export interface PostTagBreakdownItem {
  tag: string
  count: number
}

export interface PostSearchFallbackSuggestion {
  type: "tag" | "series" | "category"
  value: string
}

export interface PopularSearchTerm {
  type: "tag" | "series" | "category"
  value: string
  count: number
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ")
}

function normalizeSearchQuery(value: string) {
  return value.trim().toLowerCase()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) return 0
  if (!left) return right.length
  if (!right) return left.length

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  const current = new Array(right.length + 1)

  for (let row = 0; row < left.length; row += 1) {
    current[0] = row + 1

    for (let column = 0; column < right.length; column += 1) {
      const cost = left[row] === right[column] ? 0 : 1
      current[column + 1] = Math.min(
        current[column] + 1,
        previous[column + 1] + 1,
        previous[column] + cost
      )
    }

    for (let column = 0; column < previous.length; column += 1) {
      previous[column] = current[column]
    }
  }

  return previous[right.length]
}

function buildPostSearchText(post: Post) {
  return [
    post.title,
    post.excerpt,
    post.category,
    post.series || "",
    post.tags.join(" "),
    stripHtml(post.content),
  ]
    .join(" ")
    .toLowerCase()
}

export function matchesPostSearch(post: Post, searchQuery: string) {
  const normalizedQuery = normalizeSearchQuery(searchQuery)
  if (!normalizedQuery) return true
  return buildPostSearchText(post).includes(normalizedQuery)
}

export function getPostSearchMatchScope(post: Post, searchQuery: string): PostSearchMatchScope {
  const normalizedQuery = normalizeSearchQuery(searchQuery)

  if (!normalizedQuery) {
    return {
      title: false,
      excerpt: false,
      category: false,
      series: false,
      tags: false,
      content: false,
    }
  }

  return {
    title: post.title.toLowerCase().includes(normalizedQuery),
    excerpt: post.excerpt.toLowerCase().includes(normalizedQuery),
    category: post.category.toLowerCase().includes(normalizedQuery),
    series: (post.series || "").toLowerCase().includes(normalizedQuery),
    tags: post.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
    content: stripHtml(post.content).toLowerCase().includes(normalizedQuery),
  }
}

export function splitHighlightedText(text: string, searchQuery: string): HighlightPart[] {
  const normalizedQuery = normalizeSearchQuery(searchQuery)
  if (!normalizedQuery) {
    return [{ text, match: false }]
  }

  const matcher = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "ig")
  const parts = text.split(matcher).filter(Boolean)

  if (parts.length === 0) {
    return [{ text, match: false }]
  }

  return parts.map((part) => ({
    text: part,
    match: part.toLowerCase() === normalizedQuery,
  }))
}

function sortSuggestionValues(values: string[], searchQuery: string) {
  const normalizedQuery = normalizeSearchQuery(searchQuery)

  return [...values].sort((left, right) => {
    const leftStarts = left.toLowerCase().startsWith(normalizedQuery)
    const rightStarts = right.toLowerCase().startsWith(normalizedQuery)

    if (leftStarts && !rightStarts) return -1
    if (!leftStarts && rightStarts) return 1

    return left.localeCompare(right, "zh-CN")
  })
}

export function getPostSearchSuggestions(tags: string[], series: string[], searchQuery: string) {
  const normalizedQuery = normalizeSearchQuery(searchQuery)
  if (!normalizedQuery) return []

  const matchingTags = sortSuggestionValues(
    tags.filter((tag) => tag.toLowerCase().includes(normalizedQuery)),
    normalizedQuery
  ).map<PostSearchSuggestion>((value) => ({ type: "tag", value }))

  const matchingSeries = sortSuggestionValues(
    series.filter((item) => item.toLowerCase().includes(normalizedQuery)),
    normalizedQuery
  ).map<PostSearchSuggestion>((value) => ({ type: "series", value }))

  return [...matchingTags, ...matchingSeries]
}

export function getPostSearchFallbackSuggestions(
  tags: string[],
  series: string[],
  categories: string[],
  searchQuery: string
) {
  const normalizedQuery = normalizeSearchQuery(searchQuery)
  if (!normalizedQuery) return []

  const threshold = Math.max(2, Math.floor(normalizedQuery.length / 2))
  const candidates = [
    ...tags.map((value) => ({ type: "tag" as const, value })),
    ...series.map((value) => ({ type: "series" as const, value })),
    ...categories.map((value) => ({ type: "category" as const, value })),
  ]

  return candidates
    .map((candidate) => {
      const normalizedCandidate = normalizeSearchQuery(candidate.value)

      const includesMatch =
        normalizedCandidate.includes(normalizedQuery) || normalizedQuery.includes(normalizedCandidate)

      const distance = includesMatch ? 0 : levenshteinDistance(normalizedQuery, normalizedCandidate)

      return {
        ...candidate,
        distance,
      }
    })
    .filter((candidate) => candidate.distance <= threshold)
    .sort((left, right) => left.distance - right.distance || left.value.localeCompare(right.value, "zh-CN"))
    .slice(0, 6)
    .map<PostSearchFallbackSuggestion>(({ type, value }) => ({ type, value }))
}

export function sortPostsForDisplay(posts: Post[]) {
  return [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    if (a.series && b.series && a.series === b.series) {
      const left = typeof a.seriesOrder === "number" ? a.seriesOrder : Number.MAX_SAFE_INTEGER
      const right = typeof b.seriesOrder === "number" ? b.seriesOrder : Number.MAX_SAFE_INTEGER
      if (left !== right) return left - right
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

export function filterPostsForListing(posts: Post[], state: PostSearchState) {
  const normalizedTag = state.selectedTag?.trim() || null
  const normalizedCategory = state.selectedCategory?.trim() || null

  return sortPostsForDisplay(
    posts.filter((post) => {
      if (!state.includeDrafts && post.draft) {
        return false
      }

      if (normalizedTag && !post.tags.includes(normalizedTag)) {
        return false
      }

      if (normalizedCategory && post.category !== normalizedCategory) {
        return false
      }

      return matchesPostSearch(post, state.searchQuery)
    })
  )
}

export function sortSearchResults(posts: Post[], sortBy: SearchSortOption) {
  if (sortBy === "newest") {
    return [...posts].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
  }

  if (sortBy === "oldest") {
    return [...posts].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
  }

  return posts
}

export function getPostCategoryBreakdown(posts: Post[]) {
  const counts = new Map<string, number>()

  for (const post of posts) {
    counts.set(post.category, (counts.get(post.category) || 0) + 1)
  }

  return [...counts.entries()]
    .map<PostCategoryBreakdownItem>(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category, "zh-CN"))
}

export function getPostTagBreakdown(posts: Post[]) {
  const counts = new Map<string, number>()

  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    }
  }

  return [...counts.entries()]
    .map<PostTagBreakdownItem>(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag, "zh-CN"))
}

export function getPopularSearchTerms(posts: Post[]) {
  const tagTerms = getPostTagBreakdown(posts).map<PopularSearchTerm>(({ tag, count }) => ({
    type: "tag",
    value: tag,
    count,
  }))

  const seriesCounts = new Map<string, number>()
  const categoryCounts = new Map<string, number>()

  for (const post of posts) {
    if (post.series?.trim()) {
      const key = post.series.trim()
      seriesCounts.set(key, (seriesCounts.get(key) || 0) + 1)
    }

    categoryCounts.set(post.category, (categoryCounts.get(post.category) || 0) + 1)
  }

  const seriesTerms = [...seriesCounts.entries()].map<PopularSearchTerm>(([value, count]) => ({
    type: "series",
    value,
    count,
  }))

  const categoryTerms = [...categoryCounts.entries()].map<PopularSearchTerm>(([value, count]) => ({
    type: "category",
    value,
    count,
  }))

  const typePriority = {
    tag: 0,
    series: 1,
    category: 2,
  } as const

  const seen = new Set<string>()

  return [...tagTerms, ...seriesTerms, ...categoryTerms]
    .sort((left, right) => {
      if (left.count !== right.count) return right.count - left.count
      if (typePriority[left.type] !== typePriority[right.type]) {
        return typePriority[left.type] - typePriority[right.type]
      }
      return left.value.localeCompare(right.value, "zh-CN")
    })
    .filter((term) => {
      const key = term.value.trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 10)
}
