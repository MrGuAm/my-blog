import {
  ensureStoreReady,
  getDb,
  getSql,
  isRemoteDatabaseEnabled,
} from "./store-core"
import { rowToRateLimitBucket, type RateLimitBucketRecord, type RateLimitBucketRow } from "./store-types"

function buildBucket(scope: string, actorKey: string) {
  return `${scope}:${actorKey}`
}

export async function getRateLimitBucket(scope: string, actorKey: string) {
  await ensureStoreReady()
  const bucket = buildBucket(scope, actorKey)

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT bucket, scope, actor_key, count, window_started_at, updated_at
      FROM rate_limit_buckets
      WHERE bucket = ${bucket}
      LIMIT 1
    `) as RateLimitBucketRow[]
    return rows[0] ? rowToRateLimitBucket(rows[0]) : undefined
  }

  const row = getDb()
    .prepare(
      `
        SELECT bucket, scope, actor_key, count, window_started_at, updated_at
        FROM rate_limit_buckets
        WHERE bucket = ?
        LIMIT 1
      `
    )
    .get(bucket) as RateLimitBucketRow | undefined

  return row ? rowToRateLimitBucket(row) : undefined
}

export async function upsertRateLimitBucket(input: {
  scope: string
  actorKey: string
  count: number
  windowStartedAt: number
}) {
  await ensureStoreReady()
  const bucket = buildBucket(input.scope, input.actorKey)
  const updatedAt = new Date().toISOString()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      INSERT INTO rate_limit_buckets (bucket, scope, actor_key, count, window_started_at, updated_at)
      VALUES (${bucket}, ${input.scope}, ${input.actorKey}, ${input.count}, ${input.windowStartedAt}, ${updatedAt})
      ON CONFLICT (bucket) DO UPDATE SET
        scope = ${input.scope},
        actor_key = ${input.actorKey},
        count = ${input.count},
        window_started_at = ${input.windowStartedAt},
        updated_at = ${updatedAt}
      RETURNING bucket, scope, actor_key, count, window_started_at, updated_at
    `) as RateLimitBucketRow[]
    return rowToRateLimitBucket(rows[0])
  }

  getDb()
    .prepare(
      `
        INSERT INTO rate_limit_buckets (bucket, scope, actor_key, count, window_started_at, updated_at)
        VALUES (@bucket, @scope, @actor_key, @count, @window_started_at, @updated_at)
        ON CONFLICT(bucket) DO UPDATE SET
          scope = excluded.scope,
          actor_key = excluded.actor_key,
          count = excluded.count,
          window_started_at = excluded.window_started_at,
          updated_at = excluded.updated_at
      `
    )
    .run({
      bucket,
      scope: input.scope,
      actor_key: input.actorKey,
      count: input.count,
      window_started_at: input.windowStartedAt,
      updated_at: updatedAt,
    })

  return {
    bucket,
    scope: input.scope,
    actorKey: input.actorKey,
    count: input.count,
    windowStartedAt: input.windowStartedAt,
    updatedAt,
  } satisfies RateLimitBucketRecord
}

export async function deleteRateLimitBucket(scope: string, actorKey: string) {
  await ensureStoreReady()
  const bucket = buildBucket(scope, actorKey)

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      DELETE FROM rate_limit_buckets
      WHERE bucket = ${bucket}
      RETURNING bucket
    `) as Array<{ bucket: string }>
    return rows.length > 0
  }

  return (
    getDb()
      .prepare(
        `
          DELETE FROM rate_limit_buckets
          WHERE bucket = ?
        `
      )
      .run(bucket).changes > 0
  )
}
