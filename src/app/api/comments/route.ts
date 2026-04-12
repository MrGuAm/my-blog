import { NextResponse } from 'next/server'
import { getCachedRecentComments } from '@/lib/server/site-cache'

// GET /api/comments - 获取所有评论（最新汇总）
export async function GET() {
  return NextResponse.json({ comments: await getCachedRecentComments() })
}
