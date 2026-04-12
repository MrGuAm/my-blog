import { NextResponse } from 'next/server'
import { getCommentUserFromServer } from '@/lib/server/comment-user-auth'

export async function GET() {
  const user = await getCommentUserFromServer()
  return NextResponse.json({
    authenticated: Boolean(user),
    userId: user?.userId || null,
    username: user?.username || null,
    displayName: user?.displayName || null,
  })
}
