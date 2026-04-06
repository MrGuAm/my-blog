import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const postsDirectory = path.join(process.cwd(), 'posts')

export interface Post {
  id: string
  title: string
  excerpt: string
  date: string
  category: string
  tags: string[]
  content: string
}

function getPostSlugs(): string[] {
  return fs.readdirSync(postsDirectory).filter(file => file.endsWith('.md'))
}

function getPostBySlug(slug: string): Post | undefined {
  const fullPath = path.join(postsDirectory, slug)
  if (!fs.existsSync(fullPath)) return undefined

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    id: slug.replace(/\.md$/, ''),
    title: data.title || '',
    excerpt: data.excerpt || '',
    date: typeof data.date === 'string' ? data.date : (data.date as Date)?.toISOString?.()?.split('T')[0] || '',
    category: data.category || '',
    tags: data.tags || [],
    content,
  }
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs()
  const posts = slugs
    .map(slug => getPostBySlug(slug))
    .filter((post): post is Post => post !== undefined)
    .sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1))
  return posts
}

export function getPost(id: string): Post | undefined {
  return getPostBySlug(id)
}

export async function getPostContent(id: string): Promise<string> {
  const fullPath = path.join(postsDirectory, `${id}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { content } = matter(fileContents)

  const processedContent = await remark()
    .use(html)
    .process(content)
  return processedContent.toString()
}

export function getAllTags(): string[] {
  const posts = getAllPosts()
  return Array.from(new Set(posts.flatMap(post => post.tags))).sort()
}
