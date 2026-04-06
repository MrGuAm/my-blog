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

export async function GET() {
  try {
    const data = readPosts()
    return NextResponse.json(data.posts)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  if (!request.cookies.get('authenticated')) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, excerpt, content, category, tags, draft } = body

    if (!title || !content) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 })
    }

    const id = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-').replace(/-+/g, '-') + '-' + Date.now()
    const date = new Date().toISOString().split('T')[0]

    const newPost = {
      id,
      title,
      excerpt: excerpt || content.substring(0, 100) + '...',
      date,
      category: category || '未分类',
      tags: tags || [],
      content,
      pinned: false,
      draft: draft === true,
    }

    const data = readPosts()
    data.posts.unshift(newPost)
    writePosts(data)

    return NextResponse.json(newPost, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
