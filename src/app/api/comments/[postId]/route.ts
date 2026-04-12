import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedRequest } from '@/lib/server/auth'
import { getCommentUserFromRequest } from '@/lib/server/comment-user-auth'
import { createComment, deleteComment, getCommentById, listCommentsByPost } from '@/lib/server/store'

// GET /api/comments/[postId] - 获取某篇文章的所有评论
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  return NextResponse.json({ comments: await listCommentsByPost(postId) })
}

// POST /api/comments/[postId] - 添加评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const body = await request.json()
  const commentUser = getCommentUserFromRequest(request)
  const content = String(body.content || '')
  const author = commentUser?.displayName || String(body.author || '')

  if (!author?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '昵称和评论内容不能为空' }, { status: 400 })
  }

  const newComment = await createComment({
    postId,
    author,
    content,
    userId: commentUser?.userId || null,
  })

  return NextResponse.json({ comment: newComment })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const { searchParams } = new URL(request.url)
  const commentId = searchParams.get('commentId')

  if (!commentId) {
    return NextResponse.json({ error: '缺少评论 ID' }, { status: 400 })
  }

  const comment = await getCommentById(postId, commentId)
  if (!comment) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 })
  }

  const commentUser = getCommentUserFromRequest(request)
  const canDelete = isAuthenticatedRequest(request) || (comment.userId && comment.userId === commentUser?.userId)

  if (!canDelete) {
    return NextResponse.json({ error: '没有权限删除这条评论' }, { status: 403 })
  }

  if (!(await deleteComment(postId, commentId))) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
