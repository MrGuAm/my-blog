import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedRequest } from '@/lib/server/auth'
import { createComment, deleteComment, listCommentsByPost } from '@/lib/server/store'

// GET /api/comments/[postId] - 获取某篇文章的所有评论
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  return NextResponse.json({ comments: listCommentsByPost(postId) })
}

// POST /api/comments/[postId] - 添加评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const body = await request.json()
  const { author, content } = body

  if (!author?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '昵称和评论内容不能为空' }, { status: 400 })
  }

  const newComment = createComment({
    postId,
    author,
    content,
  })

  return NextResponse.json({ comment: newComment })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { postId } = await params
  const { searchParams } = new URL(request.url)
  const commentId = searchParams.get('commentId')

  if (!commentId) {
    return NextResponse.json({ error: '缺少评论 ID' }, { status: 400 })
  }

  if (!deleteComment(postId, commentId)) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
