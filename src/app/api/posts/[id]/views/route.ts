import { NextRequest, NextResponse } from 'next/server'
import { getPostById, incrementPostViews } from '@/lib/server/store'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await getPostById(id)

    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ views: post.views || 0 })
    }

    return NextResponse.json({ views: await incrementPostViews(id) })
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
