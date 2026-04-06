import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dataFile = path.join(process.cwd(), 'data/posts/posts.json')

function readPosts() {
  const data = fs.readFileSync(dataFile, 'utf-8')
  return JSON.parse(data)
}

function writePosts(data: { posts: any[] }) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!request.cookies.get('authenticated')) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = readPosts()
    const post = data.posts.find((p: any) => p.id === id)

    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
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
    const body = await request.json()
    const { pinned, draft, title, excerpt, content, category, tags } = body

    const data = readPosts()
    const postIndex = data.posts.findIndex((p: any) => p.id === id)

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
    const postIndex = data.posts.findIndex((p: any) => p.id === id)

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
