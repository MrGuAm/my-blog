import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedRequest } from '@/lib/server/auth'
import { deleteUserAccount, setUserBanState } from '@/lib/server/store'

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录管理员账号' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const action = String(body.action || '')
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

  if (!['ban', 'unban'].includes(action)) {
    return NextResponse.json({ error: '不支持的用户操作' }, { status: 400 })
  }

  const user = await setUserBanState(id, action === 'ban', reason || null)
  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  return NextResponse.json({ user })
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录管理员账号' }, { status: 401 })
  }

  const { id } = await params
  const deleted = await deleteUserAccount(id)
  if (!deleted) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
