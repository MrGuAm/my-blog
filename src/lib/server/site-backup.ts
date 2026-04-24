import fs from "node:fs"
import path from "node:path"
import type { PostRow, PostVersionRow, UserMusicRow, UserRow, MediaAssetRow, CommentRow, RateLimitBucketRow } from "./store-types"
import { rowToComment, rowToMediaAsset, rowToPost, rowToPostVersion, rowToRateLimitBucket, rowToUserMusic } from "./store-types"
import { ensureStoreReady, getDb, getSql, isRemoteDatabaseEnabled } from "./store-core"
import { getSiteSettingsRecord } from "./store-settings"
import { getSiteSettings } from "./site-settings"
import type {
  SiteBackupCommentRecord,
  SiteBackupMediaReference,
  SiteBackupSnapshot,
  SiteBackupUserRecord,
} from "../site-backup"

function readPackageVersion() {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const payload = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as { version?: string }
    return payload.version || "0.0.0"
  } catch {
    return "0.0.0"
  }
}

async function listAllPostRows() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    return (await sql`
      SELECT id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, featured, draft, series, series_order, views, updated_at
      FROM posts
      ORDER BY date DESC, id DESC
    `) as PostRow[]
  }

  return getDb().prepare(`
    SELECT id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, featured, draft, series, series_order, views, updated_at
    FROM posts
    ORDER BY date DESC, id DESC
  `).all() as PostRow[]
}

async function listAllPostVersionRows() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    return (await sql`
      SELECT id, post_id, title, excerpt, content, category, tags_json, cover_image, bgm_src, pinned, featured, draft, series, series_order, created_at, note
      FROM post_versions
      ORDER BY created_at DESC, id DESC
    `) as PostVersionRow[]
  }

  return getDb().prepare(`
    SELECT id, post_id, title, excerpt, content, category, tags_json, cover_image, bgm_src, pinned, featured, draft, series, series_order, created_at, note
    FROM post_versions
    ORDER BY created_at DESC, id DESC
  `).all() as PostVersionRow[]
}

async function listAllCommentRows() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    return (await sql`
      SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
      FROM comments
      ORDER BY date DESC, id DESC
    `) as CommentRow[]
  }

  return getDb().prepare(`
    SELECT id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at
    FROM comments
    ORDER BY date DESC, id DESC
  `).all() as CommentRow[]
}

async function listAllUserRows() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    return (await sql`
      SELECT id, username, display_name, password_hash, banned_at, ban_reason, created_at
      FROM users
      ORDER BY created_at DESC, id DESC
    `) as UserRow[]
  }

  return getDb().prepare(`
    SELECT id, username, display_name, password_hash, banned_at, ban_reason, created_at
    FROM users
    ORDER BY created_at DESC, id DESC
  `).all() as UserRow[]
}

async function listAllUserMusicRows() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    return (await sql`
      SELECT user_id, favorite_srcs_json, recent_srcs_json, last_track_src, last_track_time, updated_at
      FROM user_music_library
      ORDER BY updated_at DESC, user_id DESC
    `) as UserMusicRow[]
  }

  return getDb().prepare(`
    SELECT user_id, favorite_srcs_json, recent_srcs_json, last_track_src, last_track_time, updated_at
    FROM user_music_library
    ORDER BY updated_at DESC, user_id DESC
  `).all() as UserMusicRow[]
}

async function listAllMediaAssetRows() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    return (await sql`
      SELECT id, name, pathname, url, storage, content_type, size, width, height, uploaded_at, updated_at
      FROM media_assets
      ORDER BY updated_at DESC, id DESC
    `) as MediaAssetRow[]
  }

  return getDb().prepare(`
    SELECT id, name, pathname, url, storage, content_type, size, width, height, uploaded_at, updated_at
    FROM media_assets
    ORDER BY updated_at DESC, id DESC
  `).all() as MediaAssetRow[]
}

async function listAllMediaReferenceRows() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    return (await sql`
      SELECT post_id, asset_id, usage_kind
      FROM post_media_references
      ORDER BY post_id ASC, asset_id ASC
    `) as Array<{ post_id: string; asset_id: string; usage_kind: "cover" | "content" | "cover+content" }>
  }

  return getDb().prepare(`
    SELECT post_id, asset_id, usage_kind
    FROM post_media_references
    ORDER BY post_id ASC, asset_id ASC
  `).all() as Array<{ post_id: string; asset_id: string; usage_kind: "cover" | "content" | "cover+content" }>
}

async function listAllRateLimitRows() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    return (await sql`
      SELECT bucket, scope, actor_key, count, window_started_at, updated_at
      FROM rate_limit_buckets
      ORDER BY updated_at DESC, bucket ASC
    `) as RateLimitBucketRow[]
  }

  return getDb().prepare(`
    SELECT bucket, scope, actor_key, count, window_started_at, updated_at
    FROM rate_limit_buckets
    ORDER BY updated_at DESC, bucket ASC
  `).all() as RateLimitBucketRow[]
}

export async function buildSiteBackupSnapshot(): Promise<SiteBackupSnapshot> {
  const [
    postRows,
    postVersionRows,
    commentRows,
    userRows,
    userMusicRows,
    mediaRows,
    mediaReferenceRows,
    rateLimitRows,
    siteSettings,
    siteSettingsRecord,
  ] = await Promise.all([
    listAllPostRows(),
    listAllPostVersionRows(),
    listAllCommentRows(),
    listAllUserRows(),
    listAllUserMusicRows(),
    listAllMediaAssetRows(),
    listAllMediaReferenceRows(),
    listAllRateLimitRows(),
    getSiteSettings(),
    getSiteSettingsRecord(),
  ])

  const posts = postRows.map(rowToPost)
  const postVersions = postVersionRows.map(rowToPostVersion)
  const comments = commentRows.map<SiteBackupCommentRecord>((row) => ({
    ...rowToComment(row),
    reviewedAt: row.reviewed_at || null,
  }))
  const users = userRows.map<SiteBackupUserRecord>((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    bannedAt: row.banned_at || null,
    banReason: row.ban_reason || null,
    createdAt: row.created_at,
  }))
  const userMusicLibraries = userMusicRows.map(rowToUserMusic)
  const mediaAssets = mediaRows.map(rowToMediaAsset)
  const mediaReferences = mediaReferenceRows.map<SiteBackupMediaReference>((row) => ({
    postId: row.post_id,
    assetId: row.asset_id,
    usageKind: row.usage_kind,
  }))
  const rateLimitBuckets = rateLimitRows.map(rowToRateLimitBucket)

  return {
    manifest: {
      snapshotVersion: 1,
      exportedAt: new Date().toISOString(),
      appVersion: readPackageVersion(),
      sourceDatabase: isRemoteDatabaseEnabled() ? "remote" : "sqlite",
      brandName: siteSettings.brandName,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || null,
      includesLocalUploads: false,
      includesBlobObjects: false,
      counts: {
        posts: posts.length,
        postVersions: postVersions.length,
        comments: comments.length,
        users: users.length,
        userMusicLibraries: userMusicLibraries.length,
        mediaAssets: mediaAssets.length,
        mediaReferences: mediaReferences.length,
        rateLimitBuckets: rateLimitBuckets.length,
      },
    },
    data: {
      posts,
      postVersions,
      comments,
      users,
      userMusicLibraries,
      mediaAssets,
      mediaReferences,
      siteSettings: {
        settings: siteSettings,
        updatedAt: siteSettingsRecord?.updated_at || null,
      },
      rateLimitBuckets,
    },
  }
}
