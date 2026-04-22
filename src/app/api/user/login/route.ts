import { NextRequest, NextResponse } from 'next/server'
import { buildUserSessionCookie, createUserSessionToken, verifyUserPassword } from '@/lib/server/comment-user-auth'
import { consumePersistentRateLimit, getRequesterKey, resetPersistentRateLimit } from '@/lib/server/rate-limit'
import { getUserByUsername } from '@/lib/server/store'

const USER_LOGIN_RATE_WINDOW_MS = 10 * 60_000
const USER_LOGIN_RATE_LIMIT = 5

export async function POST(request: NextRequest) {
  const body = await request.json()
  const username = String(body.username || '').trim().toLowerCase()
  const password = String(body.password || '')
  const requesterKey = `${username || 'guest'}:${getRequesterKey(request, 'comment-user-login')}`

  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
  }

  const user = await getUserByUsername(username)
  if (!user || !verifyUserPassword(password, user.password_hash)) {
    const rateLimit = await consumePersistentRateLimit({
      scope: 'comment-user-login-failure',
      actorKey: requesterKey,
      limit: USER_LOGIN_RATE_LIMIT,
      windowMs: USER_LOGIN_RATE_WINDOW_MS,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: `登录尝试过于频繁，请在 ${rateLimit.retryAfterSeconds} 秒后重试` }, { status: 429 })
    }
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
  }
  if (user.banned_at) {
    return NextResponse.json({ error: user.ban_reason || '该账号已被管理员封禁' }, { status: 403 })
  }

  await resetPersistentRateLimit('comment-user-login-failure', requesterKey)

  const token = createUserSessionToken({
    userId: user.id,
    username: user.username,
    displayName: user.display_name,
  })

  const response = NextResponse.json({
    success: true,
    userId: user.id,
    username: user.username,
    displayName: user.display_name,
  })
  response.headers.append('Set-Cookie', buildUserSessionCookie(token))
  return response
}
