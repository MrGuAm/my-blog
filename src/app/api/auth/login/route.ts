import { NextRequest, NextResponse } from 'next/server'
import { buildSessionCookie, createSessionToken, getAuthPassword } from '@/lib/server/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const configuredPassword = getAuthPassword()

  if (!configuredPassword) {
    return NextResponse.json({ error: '服务端未配置登录密码' }, { status: 500 })
  }

  if (password !== configuredPassword) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.headers.append('Set-Cookie', buildSessionCookie(createSessionToken()))
  return response
}
