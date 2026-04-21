import type { NextRequest } from "next/server"
import { deleteRateLimitBucket, getRateLimitBucket, upsertRateLimitBucket } from "./store"

interface RateLimitOptions {
  scope: string
  actorKey: string
  limit: number
  windowMs: number
}

export function getRequesterKey(request: NextRequest, fallback = "guest") {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()
  return forwarded || realIp || fallback
}

export async function consumePersistentRateLimit({
  scope,
  actorKey,
  limit,
  windowMs,
}: RateLimitOptions) {
  const now = Date.now()
  const current = await getRateLimitBucket(scope, actorKey)

  if (!current || now - current.windowStartedAt >= windowMs) {
    await upsertRateLimitBucket({
      scope,
      actorKey,
      count: 1,
      windowStartedAt: now,
    })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((windowMs - (now - current.windowStartedAt)) / 1000),
    }
  }

  await upsertRateLimitBucket({
    scope,
    actorKey,
    count: current.count + 1,
    windowStartedAt: current.windowStartedAt,
  })

  return { allowed: true, retryAfterSeconds: 0 }
}

export async function resetPersistentRateLimit(scope: string, actorKey: string) {
  await deleteRateLimitBucket(scope, actorKey)
}
