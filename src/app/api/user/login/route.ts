import { NextRequest, NextResponse } from 'next/server'
import { buildUserSessionCookie, createUserSessionToken, verifyUserPassword } from '@/lib/server/comment-user-auth'
import { getUserByUsername } from '@/lib/server/store'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const username = String(body.username || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
  }

  const user = await getUserByUsername(username)
  if (!user || !verifyUserPassword(password, user.password_hash)) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
  }

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
