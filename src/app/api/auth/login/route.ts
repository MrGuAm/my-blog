import { NextRequest, NextResponse } from 'next/server'
import { buildSessionCookie, createSessionToken, getAuthPassword } from '@/lib/server/auth'
import { consumePersistentRateLimit, getRequesterKey, resetPersistentRateLimit } from '@/lib/server/rate-limit'

const ADMIN_LOGIN_RATE_WINDOW_MS = 10 * 60_000
const ADMIN_LOGIN_RATE_LIMIT = 5

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const configuredPassword = getAuthPassword()
  const requesterKey = getRequesterKey(request, 'admin-login')

  if (!configuredPassword) {
    return NextResponse.json({ error: '服务端未配置登录密码' }, { status: 500 })
  }

  if (password !== configuredPassword) {
    const rateLimit = await consumePersistentRateLimit({
      scope: 'admin-login-failure',
      actorKey: requesterKey,
      limit: ADMIN_LOGIN_RATE_LIMIT,
      windowMs: ADMIN_LOGIN_RATE_WINDOW_MS,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: `登录尝试过于频繁，请在 ${rateLimit.retryAfterSeconds} 秒后重试` }, { status: 429 })
    }
    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  }

  await resetPersistentRateLimit('admin-login-failure', requesterKey)

  const response = NextResponse.json({ success: true })
  response.headers.append('Set-Cookie', buildSessionCookie(createSessionToken()))
  return response
}
