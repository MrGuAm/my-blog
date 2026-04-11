import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { Post } from '@/lib/posts'

const dataFile = path.join(process.cwd(), 'data/posts/posts.json')

interface PostsData {
  posts: Post[]
}

function readPosts(): PostsData {
  const data = fs.readFileSync(dataFile, 'utf-8')
  return JSON.parse(data) as PostsData
}

function writePosts(data: PostsData) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

type PostPatch = Partial<Pick<Post, 'pinned' | 'draft' | 'title' | 'excerpt' | 'content' | 'category' | 'tags'>>

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = readPosts()
  const post = data.posts.find(p => p.id === id)

  if (!post) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 })
  }

  if (!request.cookies.get('authenticated')) {
    // 访客：只返回基本信息，不含 content
    const publicPost: Omit<Post, 'content'> = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      category: post.category,
      tags: post.tags,
      pinned: post.pinned,
      draft: post.draft,
      views: post.views,
    }
    return NextResponse.json(publicPost)
  }

  return NextResponse.json(post)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!request.cookies.get('authenticated')) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json() as PostPatch
    const { pinned, draft, title, excerpt, content, category, tags } = body

    const data = readPosts()
    const postIndex = data.posts.findIndex(p => p.id === id)

    if (postIndex === -1) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    if (pinned !== undefined) data.posts[postIndex].pinned = pinned
    if (draft !== undefined) data.posts[postIndex].draft = draft
    if (title !== undefined) data.posts[postIndex].title = title
    if (excerpt !== undefined) data.posts[postIndex].excerpt = excerpt
    if (content !== undefined) data.posts[postIndex].content = content
    if (category !== undefined) data.posts[postIndex].category = category
    if (tags !== undefined) data.posts[postIndex].tags = tags
    writePosts(data)

    return NextResponse.json(data.posts[postIndex])
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!request.cookies.get('authenticated')) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = readPosts()
    const postIndex = data.posts.findIndex(p => p.id === id)

    if (postIndex === -1) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    data.posts.splice(postIndex, 1)
    writePosts(data)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
