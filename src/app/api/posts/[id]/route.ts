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
    const { pinned, draft } = body

    const data = readPosts()
    const postIndex = data.posts.findIndex((p: any) => p.id === id)

    if (postIndex === -1) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    if (pinned !== undefined) data.posts[postIndex].pinned = pinned
    if (draft !== undefined) data.posts[postIndex].draft = draft
    writePosts(data)

    return NextResponse.json(data.posts[postIndex])
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
