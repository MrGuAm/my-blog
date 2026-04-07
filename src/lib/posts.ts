import fs from 'fs'
import path from 'path'

const dataFile = path.join(process.cwd(), 'data/posts/posts.json')

export interface Post {
  id: string
  title: string
  excerpt: string
  date: string
  category: string
  tags: string[]
  content: string
  pinned?: boolean
  draft?: boolean
  views?: number
}

function readPosts(): Post[] {
  try {
    const data = fs.readFileSync(dataFile, 'utf-8')
    return JSON.parse(data).posts
  } catch {
    return []
  }
}

export function getAllPosts(): Post[] {
  return readPosts().sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

export function getPost(id: string): Post | undefined {
  return readPosts().find(p => p.id === id)
}

export function getAllTags(): string[] {
  return Array.from(new Set(readPosts().filter(p => !p.draft).flatMap(p => p.tags))).sort()
}

export function getPostContent(id: string): string {
  const post = getPost(id)
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

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const allPosts = getAllPosts().filter(p => p.id !== post.id && !p.draft)
  const scored = allPosts.map(p => {
    let score = 0
    if (p.category === post.category) score += 3
    p.tags.forEach(tag => { if (post.tags.includes(tag)) score += 1 })
    return { post: p, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.post)
}

export function incrementViews(id: string): number {
  const posts = readPosts()
  const idx = posts.findIndex(p => p.id === id)
  if (idx >= 0) {
    posts[idx].views = (posts[idx].views || 0) + 1
    fs.writeFileSync(dataFile, JSON.stringify({ posts }, null, 2))
    return posts[idx].views || 0
  }
  return 0
}
