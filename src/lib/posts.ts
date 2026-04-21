import { getCachedPublicPost, getCachedPublicPosts } from '@/lib/server/site-cache'
import { getPostById, getPostBySlug, listPosts } from '@/lib/server/store'

export interface Post {
  id: string
  slug?: string
  title: string
  excerpt: string
  date: string
  category: string
  tags: string[]
  content: string
  coverImage?: string
  bgmSrc?: string
  pinned?: boolean
  featured?: boolean
  draft?: boolean
  series?: string
  seriesOrder?: number | null
  views?: number
  updatedAt?: string
}

export interface SeriesSummary {
  series: string
  posts: Post[]
  count: number
  featuredCount: number
  totalViews: number
  totalReadingTime: number
  firstPost?: Post
  latestPost?: Post
  updatedAt?: string
}

function sortPosts(posts: Post[]) {
  return [...posts].sort((a: Post, b: Post) => {
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

export function sortSeriesPosts(posts: Post[]) {
  return [...posts].sort((a, b) => {
    const leftOrder = typeof a.seriesOrder === "number" ? a.seriesOrder : Number.MAX_SAFE_INTEGER
    const rightOrder = typeof b.seriesOrder === "number" ? b.seriesOrder : Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) return leftOrder - rightOrder

    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (dateDiff !== 0) return dateDiff

    return a.title.localeCompare(b.title, "zh-CN")
  })
}

export async function getAllPosts(options?: { includeDrafts?: boolean; cached?: boolean }): Promise<Post[]> {
  const shouldUseCache = options?.cached ?? false
  const includeDrafts = options?.includeDrafts ?? true
  const posts: Post[] = shouldUseCache && !includeDrafts ? await getCachedPublicPosts() : await listPosts({ includeDrafts })
  return sortPosts(posts)
}

export async function getPost(id: string): Promise<Post | undefined> {
  const cachedPost = await getCachedPublicPost(id)
  if (cachedPost) return cachedPost
  return (await getPostById(id)) || (await getPostBySlug(id)) || undefined
}

export async function getAllTags(): Promise<string[]> {
  const posts: Post[] = await getCachedPublicPosts()
  return Array.from(new Set(posts.flatMap((post) => post.tags))).sort()
}

export async function getAllSeries(): Promise<string[]> {
  const posts: Post[] = await getCachedPublicPosts()
  return Array.from(new Set(posts.map((post) => post.series?.trim()).filter(Boolean) as string[])).sort()
}

export async function getSeriesSummaries(): Promise<SeriesSummary[]> {
  const posts = await getAllPosts({ includeDrafts: false, cached: true })
  const seriesMap = new Map<string, Post[]>()

  posts.forEach((post) => {
    const key = post.series?.trim()
    if (!key) return
    const current = seriesMap.get(key) || []
    current.push(post)
    seriesMap.set(key, current)
  })

  return [...seriesMap.entries()]
    .map(([series, seriesPosts]) => {
      const orderedPosts = sortSeriesPosts(seriesPosts)
      const latestPost = [...orderedPosts].sort(
        (a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime()
      )[0]

      return {
        series,
        posts: orderedPosts,
        count: orderedPosts.length,
        featuredCount: orderedPosts.filter((post) => post.featured).length,
        totalViews: orderedPosts.reduce((sum, post) => sum + (post.views || 0), 0),
        totalReadingTime: orderedPosts.reduce((sum, post) => sum + calculateReadingTime(post.content), 0),
        firstPost: orderedPosts[0],
        latestPost,
        updatedAt: latestPost ? latestPost.updatedAt || latestPost.date : undefined,
      }
    })
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
}

export async function getPostContent(id: string): Promise<string> {
  const post = await getPost(id)
  return post?.content || ''
}

export function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]+>/g, '')
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length
  return Math.max(1, Math.ceil(words / 200))
}

export interface TocItem {
  id: string
  text: string
  level: number
}

export function extractHeadings(content: string): TocItem[] {
  const headingRegex = /<h([23])[^>]*>([^<]+)<\/h[23]>/gi
  const headings: TocItem[] = []
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1])
    const text = match[2].trim()
    const id = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    headings.push({ id, text, level })
  }
  return headings
}

export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const allPosts = (await getAllPosts()).filter((item) => item.id !== post.id && !item.draft)
  const scored = allPosts.map(p => {
    let score = 0
    if (post.series && p.series === post.series) score += 5
    if (p.category === post.category) score += 3
    p.tags.forEach(tag => { if (post.tags.includes(tag)) score += 1 })
    return { post: p, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.post)
}

export async function getAdjacentPosts(post: Post) {
  const allPosts = (await getAllPosts({ includeDrafts: false, cached: true })).filter((item) => !item.draft)

  if (post.series) {
    const seriesPosts = sortSeriesPosts(allPosts.filter((item) => item.series === post.series))
    const currentSeriesIndex = seriesPosts.findIndex((item) => item.id === post.id)
    if (currentSeriesIndex >= 0) {
      return {
        previousPost: seriesPosts[currentSeriesIndex - 1],
        nextPost: seriesPosts[currentSeriesIndex + 1],
      }
    }
  }

  const currentIndex = allPosts.findIndex((item) => item.id === post.id)
  if (currentIndex < 0) {
    return { previousPost: undefined, nextPost: undefined }
  }

  return {
    previousPost: allPosts[currentIndex - 1],
    nextPost: allPosts[currentIndex + 1],
  }
}

export async function getPostsByTag(tag: string) {
  const normalizedTag = tag.trim()
  if (!normalizedTag) return []

  const posts = await getAllPosts({ includeDrafts: false, cached: true })
  return sortPosts(posts.filter((post) => post.tags.includes(normalizedTag)))
}

export async function getPostsBySeries(series: string) {
  const normalizedSeries = series.trim()
  if (!normalizedSeries) return []

  const posts = await getAllPosts({ includeDrafts: false, cached: true })
  return sortSeriesPosts(posts.filter((post) => post.series === normalizedSeries))
}
