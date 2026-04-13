import type { CommentRecord, CommentRow, CommentStatus } from './store'
import {
  ensureStoreReady,
  getDb,
  getSql,
  isRemoteDatabaseEnabled,
  normalizeCommentStatus,
  rowToComment,
} from './store'

export type { CommentRecord, CommentStatus } from './store'

export async function listCommentsByPost(
  postId: string,
  options?: { includePending?: boolean; includeRejected?: boolean; viewerUserId?: string | null }
) {
  await ensureStoreReady()
  const includePending = options?.includePending ?? false
  const includeRejected = options?.includeRejected ?? false
  const viewerUserId = options?.viewerUserId || null

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (includePending || includeRejected || viewerUserId
      ? await sql`
        SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
        FROM comments
        WHERE post_id = ${postId}
          AND (
            status = 'approved'
            OR (${includePending} = true AND status = 'pending')
            OR (${includeRejected} = true AND status = 'rejected')
            OR (${viewerUserId} IS NOT NULL AND user_id = ${viewerUserId})
          )
        ORDER BY date DESC, id DESC
      `
      : await sql`
        SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
        FROM comments
        WHERE post_id = ${postId} AND status = 'approved'
        ORDER BY date DESC, id DESC
      `) as CommentRow[]
    return rows.map(rowToComment)
  }

  const rows = getDb().prepare(`
    SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
    FROM comments
    WHERE post_id = ?
      AND (
        status = 'approved'
        OR (? = 1 AND status = 'pending')
        OR (? = 1 AND status = 'rejected')
        OR (? IS NOT NULL AND user_id = ?)
      )
    ORDER BY date DESC, id DESC
  `).all(postId, includePending ? 1 : 0, includeRejected ? 1 : 0, viewerUserId, viewerUserId) as CommentRow[]

  return rows.map(rowToComment)
}

export async function listRecentComments(limit = 10, options?: { includePending?: boolean }) {
  await ensureStoreReady()
  const includePending = options?.includePending ?? false

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
      FROM comments
      WHERE status = 'approved' OR (${includePending} = true AND status = 'pending')
      ORDER BY date DESC, id DESC
      LIMIT ${limit}
    `) as CommentRow[]
    return rows.map(rowToComment)
  }

  const rows = getDb().prepare(`
    SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
    FROM comments
    WHERE status = 'approved' OR (? = 1 AND status = 'pending')
    ORDER BY date DESC, id DESC
    LIMIT ?
  `).all(includePending ? 1 : 0, limit) as CommentRow[]

  return rows.map(rowToComment)
}

export async function listComments(options?: {
  statuses?: CommentStatus[]
  limit?: number
}) {
  await ensureStoreReady()
  const statuses = options?.statuses?.length ? options.statuses : ['approved', 'pending', 'rejected']
  const limit = options?.limit ?? 100

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
      FROM comments
      ORDER BY date DESC, id DESC
      LIMIT ${limit}
    `) as CommentRow[]
    return rows.map(rowToComment).filter((comment) => statuses.includes(comment.status || 'approved'))
  }

  const rows = getDb().prepare(`
    SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
    FROM comments
    ORDER BY date DESC, id DESC
    LIMIT ?
  `).all(limit) as CommentRow[]

  return rows.map(rowToComment).filter((comment) => statuses.includes(comment.status || 'approved'))
}

export async function createComment(input: {
  postId: string
  author: string
  content: string
  userId?: string | null
  parentCommentId?: string | null
  isAdmin?: boolean
  status?: CommentStatus
  moderationNote?: string | null
}) {
  await ensureStoreReady()

  const comment: CommentRecord = {
    id: Date.now().toString(),
    postId: input.postId,
    author: input.author.trim(),
    content: input.content.trim(),
    date: new Date().toISOString().split('T')[0],
    userId: input.userId || null,
    parentCommentId: input.parentCommentId || null,
    isAdmin: Boolean(input.isAdmin),
    status: normalizeCommentStatus(input.status),
    moderationNote: input.moderationNote || null,
  }

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO comments (id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at)
      VALUES (${comment.id}, ${comment.postId}, ${comment.author}, ${comment.content}, ${comment.date}, ${comment.userId || null}, ${comment.parentCommentId || null}, ${comment.isAdmin ? 1 : 0}, ${comment.status || 'approved'}, ${comment.moderationNote || null}, ${comment.status === 'pending' ? null : new Date().toISOString()})
    `
    return comment
  }

  getDb().prepare(`
    INSERT INTO comments (id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at)
    VALUES (@id, @post_id, @author, @content, @date, @user_id, @parent_comment_id, @is_admin, @status, @moderation_note, @reviewed_at)
  `).run({
    id: comment.id,
    post_id: comment.postId,
    author: comment.author,
    content: comment.content,
    date: comment.date,
    user_id: comment.userId || null,
    parent_comment_id: comment.parentCommentId || null,
    is_admin: comment.isAdmin ? 1 : 0,
    status: comment.status || 'approved',
    moderation_note: comment.moderationNote || null,
    reviewed_at: comment.status === 'pending' ? null : new Date().toISOString(),
  })

  return comment
}

export async function getCommentById(postId: string, commentId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
      FROM comments
      WHERE id = ${commentId} AND post_id = ${postId}
      LIMIT 1
    `) as CommentRow[]
    return rows[0] ? rowToComment(rows[0]) : undefined
  }

  const row = getDb().prepare(`
    SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
    FROM comments
    WHERE id = ? AND post_id = ?
    LIMIT 1
  `).get(commentId, postId) as CommentRow | undefined

  return row ? rowToComment(row) : undefined
}

export async function moderateComment(postId: string, commentId: string, status: CommentStatus, moderationNote?: string | null) {
  await ensureStoreReady()
  const nextStatus = normalizeCommentStatus(status)
  const reviewedAt = new Date().toISOString()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      UPDATE comments
      SET status = ${nextStatus},
          moderation_note = ${moderationNote || null},
          reviewed_at = ${reviewedAt}
      WHERE id = ${commentId} AND post_id = ${postId}
      RETURNING id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
    `) as CommentRow[]
    return rows[0] ? rowToComment(rows[0]) : undefined
  }

  getDb().prepare(`
    UPDATE comments
    SET status = ?, moderation_note = ?, reviewed_at = ?
    WHERE id = ? AND post_id = ?
  `).run(nextStatus, moderationNote || null, reviewedAt, commentId, postId)

  return getCommentById(postId, commentId)
}

async function listCommentRelationsByPost(postId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, parent_comment_id
      FROM comments
      WHERE post_id = ${postId}
    `) as Array<{ id: string; parent_comment_id?: string | null }>
    return rows
  }

  return getDb().prepare(`
    SELECT id, parent_comment_id
    FROM comments
    WHERE post_id = ?
  `).all(postId) as Array<{ id: string; parent_comment_id?: string | null }>
}

export async function deleteComment(postId: string, commentId: string) {
  await ensureStoreReady()
  const relations = await listCommentRelationsByPost(postId)
  const targetIds = new Set<string>([commentId])

  let changed = true
  while (changed) {
    changed = false
    for (const relation of relations) {
      if (relation.parent_comment_id && targetIds.has(relation.parent_comment_id) && !targetIds.has(relation.id)) {
        targetIds.add(relation.id)
        changed = true
      }
    }
  }

  const ids = Array.from(targetIds)

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    let deletedCount = 0
    for (const id of ids) {
      const rows = (await sql`
        DELETE FROM comments
        WHERE post_id = ${postId} AND id = ${id}
        RETURNING id
      `) as Array<{ id: string }>
      deletedCount += rows.length
    }
    return deletedCount > 0
  }

  const placeholders = ids.map(() => '?').join(', ')
  const result = getDb().prepare(`DELETE FROM comments WHERE post_id = ? AND id IN (${placeholders})`).run(postId, ...ids)
  return result.changes > 0
}
