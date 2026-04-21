import {
  ensureStoreReady,
  getDb,
  getSql,
  isRemoteDatabaseEnabled,
} from './store-core'
import {
  rowToMediaAsset,
  rowToUser,
  rowToUserMusic,
  type MediaAssetRecord,
  type MediaAssetRow,
  type UserMusicLibrary,
  type UserMusicRow,
  type UserRow,
} from './store-types'

export async function getUserByUsername(username: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, username, display_name, password_hash, banned_at, ban_reason, created_at
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `) as UserRow[]
    return rows[0]
  }

  return getDb().prepare(`
    SELECT id, username, display_name, password_hash, banned_at, ban_reason, created_at
    FROM users
    WHERE username = ?
    LIMIT 1
  `).get(username) as UserRow | undefined
}

export async function getUserById(userId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, username, display_name, password_hash, banned_at, ban_reason, created_at
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `) as UserRow[]
    return rows[0]
  }

  return getDb().prepare(`
    SELECT id, username, display_name, password_hash, banned_at, ban_reason, created_at
    FROM users
    WHERE id = ?
    LIMIT 1
  `).get(userId) as UserRow | undefined
}

export async function createUser(input: { id: string; username: string; displayName: string; passwordHash: string }) {
  await ensureStoreReady()

  const createdAt = new Date().toISOString()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO users (id, username, display_name, password_hash, banned_at, ban_reason, created_at)
      VALUES (${input.id}, ${input.username}, ${input.displayName}, ${input.passwordHash}, NULL, NULL, ${createdAt})
    `
    return { ...input, createdAt, bannedAt: null, banReason: null }
  }

  getDb().prepare(`
    INSERT INTO users (id, username, display_name, password_hash, banned_at, ban_reason, created_at)
    VALUES (@id, @username, @display_name, @password_hash, @banned_at, @ban_reason, @created_at)
  `).run({
    id: input.id,
    username: input.username,
    display_name: input.displayName,
    password_hash: input.passwordHash,
    banned_at: null,
    ban_reason: null,
    created_at: createdAt,
  })

  return { ...input, createdAt, bannedAt: null, banReason: null }
}

export async function listUsers(limit = 50) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, username, display_name, password_hash, banned_at, ban_reason, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ${limit}
    `) as UserRow[]
    return rows.map(rowToUser)
  }

  const rows = getDb().prepare(`
    SELECT id, username, display_name, password_hash, banned_at, ban_reason, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as UserRow[]

  return rows.map(rowToUser)
}

export async function setUserBanState(userId: string, banned: boolean, reason?: string | null) {
  await ensureStoreReady()
  const bannedAt = banned ? new Date().toISOString() : null
  const banReason = banned ? reason || '管理员操作' : null

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      UPDATE users
      SET banned_at = ${bannedAt},
          ban_reason = ${banReason}
      WHERE id = ${userId}
      RETURNING id, username, display_name, password_hash, banned_at, ban_reason, created_at
    `) as UserRow[]
    return rows[0] ? rowToUser(rows[0]) : undefined
  }

  getDb().prepare(`
    UPDATE users
    SET banned_at = ?, ban_reason = ?
    WHERE id = ?
  `).run(bannedAt, banReason, userId)

  const updated = await getUserById(userId)
  return updated ? rowToUser(updated) : undefined
}

export async function deleteUserAccount(userId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`UPDATE comments SET user_id = NULL WHERE user_id = ${userId}`
    await sql`DELETE FROM user_music_library WHERE user_id = ${userId}`
    const rows = (await sql`
      DELETE FROM users
      WHERE id = ${userId}
      RETURNING id
    `) as Array<{ id: string }>
    return rows.length > 0
  }

  const db = getDb()
  const tx = db.transaction(() => {
    db.prepare('UPDATE comments SET user_id = NULL WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM user_music_library WHERE user_id = ?').run(userId)
    return db.prepare('DELETE FROM users WHERE id = ?').run(userId).changes > 0
  })

  return tx()
}

export async function getUserMusicLibrary(userId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT user_id, favorite_srcs_json, recent_srcs_json, last_track_src, last_track_time, updated_at
      FROM user_music_library
      WHERE user_id = ${userId}
      LIMIT 1
    `) as UserMusicRow[]
    return rows[0] ? rowToUserMusic(rows[0]) : undefined
  }

  const row = getDb().prepare(`
    SELECT user_id, favorite_srcs_json, recent_srcs_json, last_track_src, last_track_time, updated_at
    FROM user_music_library
    WHERE user_id = ?
    LIMIT 1
  `).get(userId) as UserMusicRow | undefined

  return row ? rowToUserMusic(row) : undefined
}

export async function upsertUserMusicLibrary(input: {
  userId: string
  favoriteSrcs?: string[]
  recentSrcs?: string[]
  lastTrackSrc?: string | null
  lastTrackTime?: number | null
}) {
  await ensureStoreReady()
  const updatedAt = new Date().toISOString()
  const existing = await getUserMusicLibrary(input.userId)
  const favoriteSrcs = input.favoriteSrcs ?? existing?.favoriteSrcs ?? []
  const recentSrcs = input.recentSrcs ?? existing?.recentSrcs ?? []
  const lastTrackSrc = input.lastTrackSrc !== undefined ? input.lastTrackSrc : existing?.lastTrackSrc ?? null
  const lastTrackTime = input.lastTrackTime !== undefined ? Math.max(0, Number(input.lastTrackTime) || 0) : existing?.lastTrackTime ?? 0

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO user_music_library (user_id, favorite_srcs_json, recent_srcs_json, last_track_src, last_track_time, updated_at)
      VALUES (${input.userId}, ${JSON.stringify(favoriteSrcs)}, ${JSON.stringify(recentSrcs)}, ${lastTrackSrc}, ${lastTrackTime}, ${updatedAt})
      ON CONFLICT (user_id) DO UPDATE SET
        favorite_srcs_json = ${JSON.stringify(favoriteSrcs)},
        recent_srcs_json = ${JSON.stringify(recentSrcs)},
        last_track_src = ${lastTrackSrc},
        last_track_time = ${lastTrackTime},
        updated_at = ${updatedAt}
    `
    return {
      userId: input.userId,
      favoriteSrcs,
      recentSrcs,
      lastTrackSrc,
      lastTrackTime,
      updatedAt,
    } satisfies UserMusicLibrary
  }

  getDb().prepare(`
    INSERT INTO user_music_library (user_id, favorite_srcs_json, recent_srcs_json, last_track_src, last_track_time, updated_at)
    VALUES (@user_id, @favorite_srcs_json, @recent_srcs_json, @last_track_src, @last_track_time, @updated_at)
    ON CONFLICT(user_id) DO UPDATE SET
      favorite_srcs_json = excluded.favorite_srcs_json,
      recent_srcs_json = excluded.recent_srcs_json,
      last_track_src = excluded.last_track_src,
      last_track_time = excluded.last_track_time,
      updated_at = excluded.updated_at
  `).run({
    user_id: input.userId,
    favorite_srcs_json: JSON.stringify(favoriteSrcs),
    recent_srcs_json: JSON.stringify(recentSrcs),
    last_track_src: lastTrackSrc,
    last_track_time: lastTrackTime,
    updated_at: updatedAt,
  })

  return {
    userId: input.userId,
    favoriteSrcs,
    recentSrcs,
    lastTrackSrc,
    lastTrackTime,
    updatedAt,
  } satisfies UserMusicLibrary
}

export async function listMediaAssetRecords() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, name, pathname, url, storage, content_type, size, uploaded_at, updated_at
      FROM media_assets
      ORDER BY updated_at DESC
    `) as MediaAssetRow[]
    return rows.map(rowToMediaAsset)
  }

  const rows = getDb().prepare(`
    SELECT id, name, pathname, url, storage, content_type, size, uploaded_at, updated_at
    FROM media_assets
    ORDER BY updated_at DESC
  `).all() as MediaAssetRow[]
  return rows.map(rowToMediaAsset)
}

export async function getMediaAssetRecordById(id: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, name, pathname, url, storage, content_type, size, uploaded_at, updated_at
      FROM media_assets
      WHERE id = ${id}
      LIMIT 1
    `) as MediaAssetRow[]
    return rows[0] ? rowToMediaAsset(rows[0]) : undefined
  }

  const row = getDb().prepare(`
    SELECT id, name, pathname, url, storage, content_type, size, uploaded_at, updated_at
    FROM media_assets
    WHERE id = ?
    LIMIT 1
  `).get(id) as MediaAssetRow | undefined
  return row ? rowToMediaAsset(row) : undefined
}

export async function getMediaAssetRecordByName(name: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, name, pathname, url, storage, content_type, size, uploaded_at, updated_at
      FROM media_assets
      WHERE name = ${name}
      LIMIT 1
    `) as MediaAssetRow[]
    return rows[0] ? rowToMediaAsset(rows[0]) : undefined
  }

  const row = getDb().prepare(`
    SELECT id, name, pathname, url, storage, content_type, size, uploaded_at, updated_at
    FROM media_assets
    WHERE name = ?
    LIMIT 1
  `).get(name) as MediaAssetRow | undefined
  return row ? rowToMediaAsset(row) : undefined
}

export async function upsertMediaAssetRecord(input: MediaAssetRecord) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      INSERT INTO media_assets (id, name, pathname, url, storage, content_type, size, uploaded_at, updated_at)
      VALUES (${input.id}, ${input.name}, ${input.pathname}, ${input.url}, ${input.storage}, ${input.contentType}, ${input.size}, ${input.uploadedAt}, ${input.updatedAt})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        pathname = EXCLUDED.pathname,
        url = EXCLUDED.url,
        storage = EXCLUDED.storage,
        content_type = EXCLUDED.content_type,
        size = EXCLUDED.size,
        uploaded_at = EXCLUDED.uploaded_at,
        updated_at = EXCLUDED.updated_at
      RETURNING id, name, pathname, url, storage, content_type, size, uploaded_at, updated_at
    `) as MediaAssetRow[]
    return rowToMediaAsset(rows[0])
  }

  getDb().prepare(`
    INSERT INTO media_assets (id, name, pathname, url, storage, content_type, size, uploaded_at, updated_at)
    VALUES (@id, @name, @pathname, @url, @storage, @content_type, @size, @uploaded_at, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      pathname = excluded.pathname,
      url = excluded.url,
      storage = excluded.storage,
      content_type = excluded.content_type,
      size = excluded.size,
      uploaded_at = excluded.uploaded_at,
      updated_at = excluded.updated_at
  `).run({
    id: input.id,
    name: input.name,
    pathname: input.pathname,
    url: input.url,
    storage: input.storage,
    content_type: input.contentType,
    size: input.size,
    uploaded_at: input.uploadedAt,
    updated_at: input.updatedAt,
  })

  return input
}

export async function deleteMediaAssetRecord(id: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      DELETE FROM media_assets
      WHERE id = ${id}
      RETURNING id
    `) as Array<{ id: string }>
    return rows.length > 0
  }

  return getDb().prepare('DELETE FROM media_assets WHERE id = ?').run(id).changes > 0
}
