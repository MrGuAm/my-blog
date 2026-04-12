import { NextRequest, NextResponse } from 'next/server'
import { getCommentUserFromRequest } from '@/lib/server/comment-user-auth'
import { getUserMusicLibrary, upsertUserMusicLibrary } from '@/lib/server/store'

export async function GET(request: NextRequest) {
  const user = getCommentUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ authenticated: false, favoriteSrcs: [], recentSrcs: [], lastTrackSrc: null, lastTrackTime: 0 })
  }

  const library = await getUserMusicLibrary(user.userId)
  return NextResponse.json({
    authenticated: true,
    favoriteSrcs: library?.favoriteSrcs || [],
    recentSrcs: library?.recentSrcs || [],
    lastTrackSrc: library?.lastTrackSrc || null,
    lastTrackTime: library?.lastTrackTime || 0,
    updatedAt: library?.updatedAt || null,
  })
}

export async function PATCH(request: NextRequest) {
  const user = getCommentUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录评论账号' }, { status: 401 })
  }

  const body = await request.json()
  const favoriteSrcs = Array.isArray(body.favoriteSrcs)
    ? body.favoriteSrcs.filter((item: unknown): item is string => typeof item === 'string').slice(0, 100)
    : undefined
  const recentSrcs = Array.isArray(body.recentSrcs)
    ? body.recentSrcs.filter((item: unknown): item is string => typeof item === 'string').slice(0, 20)
    : undefined
  const lastTrackSrc = typeof body.lastTrackSrc === 'string' ? body.lastTrackSrc : body.lastTrackSrc === null ? null : undefined
  const lastTrackTime = typeof body.lastTrackTime === 'number' && Number.isFinite(body.lastTrackTime)
    ? Math.max(0, body.lastTrackTime)
    : undefined

  const library = await upsertUserMusicLibrary({
    userId: user.userId,
    favoriteSrcs,
    recentSrcs,
    lastTrackSrc,
    lastTrackTime,
  })

  return NextResponse.json(library)
}
