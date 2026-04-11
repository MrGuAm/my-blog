import { NextResponse } from 'next/server'
import { listRecentComments } from '@/lib/server/store'

// GET /api/comments - 获取所有评论（最新汇总）
export async function GET() {
  return NextResponse.json({ comments: listRecentComments(10) })
}
