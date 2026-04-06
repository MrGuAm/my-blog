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
  return Array.from(new Set(readPosts().flatMap(p => p.tags))).sort()
}

export function getPostContent(id: string): string {
  const post = getPost(id)
  return post?.content || ''
}
