import type { NextRequest } from 'next/server'
import { consumePersistentRateLimit, getRequesterKey } from './rate-limit'

const blockedWords = ['博彩', '赌博', '返利', '刷单', '加微信', '加v', '兼职日结']
const RATE_WINDOW_MS = 60_000
const RATE_LIMIT = 4

export function validateCommentContent(content: string) {
  const normalized = content.trim()
  if (normalized.length < 2) {
    return '评论至少写两个字吧'
  }

  if (blockedWords.some((word) => normalized.includes(word))) {
    return '评论里包含了不适合公开展示的内容'
  }

  if (/(https?:\/\/|www\.)/i.test(normalized) && normalized.length < 20) {
    return '带链接的评论太短了，系统先拦一下'
  }

  return ''
}

export async function checkCommentRateLimit(request: NextRequest, actorId?: string | null) {
  const key = `${actorId || 'guest'}:${getRequesterKey(request, actorId || 'guest')}`
  return consumePersistentRateLimit({
    scope: 'comment-post',
    actorKey: key,
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS,
  })
}
