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

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ")
}

function normalizeSearchQuery(value: string) {
  return value.trim().toLowerCase()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
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
