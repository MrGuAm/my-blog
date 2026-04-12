import { NextResponse } from 'next/server'
import { buildExpiredUserSessionCookie } from '@/lib/server/comment-user-auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.headers.append('Set-Cookie', buildExpiredUserSessionCookie())
  return response
}
