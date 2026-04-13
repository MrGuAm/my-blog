import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedRequest } from '@/lib/server/auth'
import { getCommentUserFromRequest } from '@/lib/server/comment-user-auth'
import { checkCommentRateLimit, validateCommentContent } from '@/lib/server/comment-guard'
import { invalidateCommentsCache } from '@/lib/server/site-cache'
import { createComment, deleteComment, getCommentById, listCommentsByPost, moderateComment } from '@/lib/server/store'

// GET /api/comments/[postId] - 获取某篇文章的所有评论
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const commentUser = await getCommentUserFromRequest(request)
  const isAdmin = isAuthenticatedRequest(request)
  return NextResponse.json({
    comments: await listCommentsByPost(postId, {
      includePending: isAdmin,
      includeRejected: isAdmin,
      viewerUserId: commentUser?.userId || null,
    }),
  })
}

// POST /api/comments/[postId] - 添加评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const body = await request.json()
  const commentUser = await getCommentUserFromRequest(request)
  const isAdminActor = isAuthenticatedRequest(request) && !commentUser?.userId
  const parentCommentId = typeof body.parentCommentId === 'string' && body.parentCommentId.trim() ? body.parentCommentId.trim() : null
  const content = String(body.content || '')
  const author = commentUser?.displayName || (isAdminActor ? '站长' : String(body.author || ''))

  if (!author?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '昵称和评论内容不能为空' }, { status: 400 })
  }

  if (parentCommentId) {
    const parentComment = await getCommentById(postId, parentCommentId)
    if (!parentComment) {
      return NextResponse.json({ error: '回复的目标评论不存在' }, { status: 404 })
    }
  }

  const validationError = validateCommentContent(content)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const rateLimit = checkCommentRateLimit(request, commentUser?.userId || null)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: `评论太快啦，${rateLimit.retryAfterSeconds} 秒后再试` }, { status: 429 })
  }

  const newComment = await createComment({
    postId,
    author,
    content,
    userId: commentUser?.userId || null,
    parentCommentId,
    isAdmin: isAdminActor,
    status: commentUser?.userId || isAdminActor ? 'approved' : 'pending',
    moderationNote: commentUser?.userId || isAdminActor ? null : '等待管理员审核',
  })

  invalidateCommentsCache()

  return NextResponse.json({
    comment: newComment,
    message: newComment.status === 'pending' ? '评论已提交，等待审核后会公开显示' : '评论发布成功！',
  })
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

  const commentUser = await getCommentUserFromRequest(request)
  const canDelete = isAuthenticatedRequest(request) || (comment.userId && comment.userId === commentUser?.userId)

  if (!canDelete) {
    return NextResponse.json({ error: '没有权限删除这条评论' }, { status: 403 })
  }

  if (!(await deleteComment(postId, commentId))) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 })
  }

  invalidateCommentsCache()

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { postId } = await params
  const body = await request.json()
  const commentId = String(body.commentId || '')
  const status = String(body.status || '')
  const moderationNote = typeof body.moderationNote === 'string' ? body.moderationNote : null

  if (!commentId || !['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: '审核参数不正确' }, { status: 400 })
  }

  const comment = await moderateComment(postId, commentId, status as 'approved' | 'rejected' | 'pending', moderationNote)
  if (!comment) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 })
  }

  invalidateCommentsCache()
  return NextResponse.json({ comment })
}
