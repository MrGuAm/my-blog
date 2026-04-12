import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedRequest } from '@/lib/server/auth'
import { invalidatePostsCache } from '@/lib/server/site-cache'
import { getPostVersion, listPostVersions, updatePost } from '@/lib/server/store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { id } = await params
  return NextResponse.json({ versions: await listPostVersions(id) })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const versionId = String(body.versionId || '')

  if (!versionId) {
    return NextResponse.json({ error: '缺少版本 ID' }, { status: 400 })
  }

  const version = await getPostVersion(id, versionId)
  if (!version) {
    return NextResponse.json({ error: '版本不存在' }, { status: 404 })
  }

  const restored = await updatePost(id, {
    title: version.title,
    excerpt: version.excerpt,
    content: version.content,
    category: version.category,
    tags: version.tags,
    coverImage: version.coverImage,
    bgmSrc: version.bgmSrc,
    pinned: version.pinned,
    draft: version.draft,
  })

  invalidatePostsCache()
  return NextResponse.json({ post: restored })
}
