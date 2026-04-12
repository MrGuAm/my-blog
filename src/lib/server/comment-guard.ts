import type { NextRequest } from 'next/server'

const blockedWords = ['博彩', '赌博', '返利', '刷单', '加微信', '加v', '兼职日结']
const RATE_WINDOW_MS = 60_000
const RATE_LIMIT = 4

declare global {
  var __commentRateLimitStore: Map<string, number[]> | undefined
}

function getStore() {
  if (!global.__commentRateLimitStore) {
    global.__commentRateLimitStore = new Map()
  }
  return global.__commentRateLimitStore
}

function getRequesterKey(request: NextRequest, fallback = 'guest') {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()
  return forwarded || realIp || fallback
}

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

export function checkCommentRateLimit(request: NextRequest, actorId?: string | null) {
  const key = `${actorId || 'guest'}:${getRequesterKey(request, actorId || 'guest')}`
  const now = Date.now()
  const store = getStore()
  const recent = (store.get(key) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS)

  if (recent.length >= RATE_LIMIT) {
    store.set(key, recent)
    return { allowed: false, retryAfterSeconds: Math.ceil((RATE_WINDOW_MS - (now - recent[0])) / 1000) }
  }

  recent.push(now)
  store.set(key, recent)
  return { allowed: true, retryAfterSeconds: 0 }
}
