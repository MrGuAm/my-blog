import { NextRequest, NextResponse } from 'next/server'
import type { Post } from '@/lib/posts'
import { isAuthenticatedRequest } from '@/lib/server/auth'
import { invalidatePostsCache } from '@/lib/server/site-cache'
import { createPost, listPosts } from '@/lib/server/store'

export async function GET(request: NextRequest) {
  try {
    const includeDrafts = isAuthenticatedRequest(request)
    return NextResponse.json(await listPosts({ includeDrafts }))
  } catch {
    return NextResponse.json({ error: '数据存储暂不可用' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, slug, excerpt, content, category, tags, draft, pinned, coverImage, bgmSrc } = body

    if (!title || !content) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 })
    }

    const newPost: Post = await createPost({
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      coverImage,
      bgmSrc,
      draft,
      pinned,
    })

    invalidatePostsCache()

    return NextResponse.json(newPost, { status: 201 })
  } catch {
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
