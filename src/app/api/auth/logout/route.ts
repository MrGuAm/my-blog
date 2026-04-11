import { NextResponse } from 'next/server'
import { buildExpiredSessionCookie } from '@/lib/server/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.headers.append('Set-Cookie', buildExpiredSessionCookie())
  return response
}
