import {
  ensureStoreReady,
  getDb,
  getSql,
  isRemoteDatabaseEnabled,
} from "./store-core"
import {
  rowToMusicTrackRecord,
  type MusicTrackRecord,
  type MusicTrackRow,
} from "./store-types"

export async function listMusicTrackRecords() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, name, pathname, url, storage, content_type, size, title, artist, album, cover_url, lyrics, uploaded_at, updated_at
      FROM music_tracks
      ORDER BY updated_at DESC, id DESC
    `) as MusicTrackRow[]
    return rows.map(rowToMusicTrackRecord)
  }

  const rows = getDb().prepare(`
    SELECT id, name, pathname, url, storage, content_type, size, title, artist, album, cover_url, lyrics, uploaded_at, updated_at
    FROM music_tracks
    ORDER BY updated_at DESC, id DESC
  `).all() as MusicTrackRow[]

  return rows.map(rowToMusicTrackRecord)
}

export async function getMusicTrackRecordById(trackId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, name, pathname, url, storage, content_type, size, title, artist, album, cover_url, lyrics, uploaded_at, updated_at
      FROM music_tracks
      WHERE id = ${trackId}
      LIMIT 1
    `) as MusicTrackRow[]
    return rows[0] ? rowToMusicTrackRecord(rows[0]) : undefined
  }

  const row = getDb().prepare(`
    SELECT id, name, pathname, url, storage, content_type, size, title, artist, album, cover_url, lyrics, uploaded_at, updated_at
    FROM music_tracks
    WHERE id = ?
    LIMIT 1
  `).get(trackId) as MusicTrackRow | undefined

  return row ? rowToMusicTrackRecord(row) : undefined
}

export async function getMusicTrackRecordByPathname(pathname: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, name, pathname, url, storage, content_type, size, title, artist, album, cover_url, lyrics, uploaded_at, updated_at
      FROM music_tracks
      WHERE pathname = ${pathname}
      LIMIT 1
    `) as MusicTrackRow[]
    return rows[0] ? rowToMusicTrackRecord(rows[0]) : undefined
  }

  const row = getDb().prepare(`
    SELECT id, name, pathname, url, storage, content_type, size, title, artist, album, cover_url, lyrics, uploaded_at, updated_at
    FROM music_tracks
    WHERE pathname = ?
    LIMIT 1
  `).get(pathname) as MusicTrackRow | undefined

  return row ? rowToMusicTrackRecord(row) : undefined
}

export async function upsertMusicTrackRecord(input: MusicTrackRecord) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO music_tracks (id, name, pathname, url, storage, content_type, size, title, artist, album, cover_url, lyrics, uploaded_at, updated_at)
      VALUES (
        ${input.id},
        ${input.name},
        ${input.pathname},
        ${input.url},
        ${input.storage},
        ${input.contentType},
        ${input.size},
        ${input.title},
        ${input.artist},
        ${input.album || ""},
        ${input.coverUrl || ""},
        ${input.lyrics || ""},
        ${input.uploadedAt},
        ${input.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = excluded.name,
        pathname = excluded.pathname,
        url = excluded.url,
        storage = excluded.storage,
        content_type = excluded.content_type,
        size = excluded.size,
        title = excluded.title,
        artist = excluded.artist,
        album = excluded.album,
        cover_url = excluded.cover_url,
        lyrics = excluded.lyrics,
        uploaded_at = excluded.uploaded_at,
        updated_at = excluded.updated_at
    `
    return input
  }

  getDb().prepare(`
    INSERT INTO music_tracks (id, name, pathname, url, storage, content_type, size, title, artist, album, cover_url, lyrics, uploaded_at, updated_at)
    VALUES (@id, @name, @pathname, @url, @storage, @content_type, @size, @title, @artist, @album, @cover_url, @lyrics, @uploaded_at, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      pathname = excluded.pathname,
      url = excluded.url,
      storage = excluded.storage,
      content_type = excluded.content_type,
      size = excluded.size,
      title = excluded.title,
      artist = excluded.artist,
      album = excluded.album,
      cover_url = excluded.cover_url,
      lyrics = excluded.lyrics,
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
    title: input.title,
    artist: input.artist,
    album: input.album || "",
    cover_url: input.coverUrl || "",
    lyrics: input.lyrics || "",
    uploaded_at: input.uploadedAt,
    updated_at: input.updatedAt,
  })

  return input
}

export async function deleteMusicTrackRecord(trackId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      DELETE FROM music_tracks
      WHERE id = ${trackId}
      RETURNING id
    `) as Array<{ id: string }>
    return rows.length > 0
  }

  return getDb().prepare(`
    DELETE FROM music_tracks
    WHERE id = ?
  `).run(trackId).changes > 0
}
