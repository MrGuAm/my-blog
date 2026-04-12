import { NextRequest, NextResponse } from 'next/server'
import type { Post } from '@/lib/posts'
import { isAuthenticatedRequest } from '@/lib/server/auth'
import { deletePost, getPostById, updatePost } from '@/lib/server/store'

type PostPatch = Partial<Pick<Post, 'pinned' | 'draft' | 'title' | 'excerpt' | 'content' | 'category' | 'tags' | 'coverImage' | 'bgmSrc'>>

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await getPostById(id)

  if (!post) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 })
  }

  if (!isAuthenticatedRequest(request)) {
    if (post.draft) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    // 访客：只返回基本信息，不含 content
    const publicPost: Omit<Post, 'content'> = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      category: post.category,
      tags: post.tags,
      coverImage: post.coverImage,
      bgmSrc: post.bgmSrc,
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
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json() as PostPatch
    const post = await updatePost(id, body)

    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params
    if (!(await deletePost(id))) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
