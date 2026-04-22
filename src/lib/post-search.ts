import type { Post } from "@/lib/posts"

export interface PostSearchState {
  searchQuery: string
  selectedTag: string | null
  includeDrafts: boolean
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ")
}

function normalizeSearchQuery(value: string) {
  return value.trim().toLowerCase()
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

  return sortPostsForDisplay(
    posts.filter((post) => {
      if (!state.includeDrafts && post.draft) {
        return false
      }

      if (normalizedTag && !post.tags.includes(normalizedTag)) {
        return false
      }

      return matchesPostSearch(post, state.searchQuery)
    })
  )
}
