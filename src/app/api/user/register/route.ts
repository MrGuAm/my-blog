import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { buildUserSessionCookie, createUserSessionToken, hashUserPassword } from '@/lib/server/comment-user-auth'
import { createUser, getUserByUsername } from '@/lib/server/store'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const username = String(body.username || '').trim().toLowerCase()
  const displayName = String(body.displayName || '').trim()
  const password = String(body.password || '')

  if (!username || !displayName || !password) {
    return NextResponse.json({ error: '用户名、昵称和密码不能为空' }, { status: 400 })
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json({ error: '用户名只能包含小写字母、数字和下划线，长度 3-20 位' }, { status: 400 })
  }
  if (displayName.length > 20) {
    return NextResponse.json({ error: '昵称最多 20 个字符' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 })
  }

  const existing = await getUserByUsername(username)
  if (existing) {
    return NextResponse.json({ error: '用户名已存在' }, { status: 409 })
  }

  const user = await createUser({
    id: randomUUID(),
    username,
    displayName,
    passwordHash: hashUserPassword(password),
  })

  const token = createUserSessionToken({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
  })

  const response = NextResponse.json({
    success: true,
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
  })
  response.headers.append('Set-Cookie', buildUserSessionCookie(token))
  return response
}
