import { getPostById, listPosts } from '@/lib/server/store'

export interface Post {
  id: string
  title: string
  excerpt: string
  date: string
  category: string
  tags: string[]
  content: string
  coverImage?: string
  bgmSrc?: string
  pinned?: boolean
  draft?: boolean
  views?: number
}

export async function getAllPosts(): Promise<Post[]> {
  const posts: Post[] = await listPosts({ includeDrafts: true })
  return posts.sort((a: Post, b: Post) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

export async function getPost(id: string): Promise<Post | undefined> {
  return getPostById(id)
}

export async function getAllTags(): Promise<string[]> {
  const posts: Post[] = await listPosts({ includeDrafts: false })
  return Array.from(new Set(posts.flatMap((post) => post.tags))).sort()
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
    if (p.category === post.category) score += 3
    p.tags.forEach(tag => { if (post.tags.includes(tag)) score += 1 })
    return { post: p, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.post)
}
