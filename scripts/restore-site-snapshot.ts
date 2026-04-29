import fs from "node:fs"
import path from "node:path"
import type { SiteBackupSnapshot } from "../src/lib/site-backup"

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag)
  if (index < 0) return null
  return process.argv[index + 1] || null
}

async function main() {
  const inputArg = process.argv[2]
  if (!inputArg) {
    console.error("用法: npm run restore:snapshot -- <snapshot.json | snapshot-dir> [--db /path/to/blog.db] [--uploads /path/to/uploads] [--music /path/to/music]")
    process.exit(1)
  }

  const inputPath = path.resolve(inputArg)
  const stats = fs.statSync(inputPath)
  const snapshotPath = stats.isDirectory() ? path.join(inputPath, "snapshot.json") : inputPath
  const uploadsSourceDir = stats.isDirectory() ? path.join(inputPath, "uploads") : path.join(path.dirname(inputPath), "uploads")
  const musicSourceDir = stats.isDirectory() ? path.join(inputPath, "music") : path.join(path.dirname(inputPath), "music")

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf-8")) as SiteBackupSnapshot
  if (snapshot.manifest?.snapshotVersion !== 1) {
    throw new Error(`不支持的快照版本: ${snapshot.manifest?.snapshotVersion ?? "unknown"}`)
  }

  const dbArg = getArgValue("--db")
  const uploadsArg = getArgValue("--uploads")
  const musicArg = getArgValue("--music")
  const targetDbPath = dbArg
    ? path.resolve(dbArg)
    : process.env.BLOG_DB_PATH
      ? path.resolve(process.env.BLOG_DB_PATH)
      : path.join(process.cwd(), "data", "blog.db")

  const targetDataDir = path.dirname(targetDbPath)
  const targetUploadsDir = uploadsArg
    ? path.resolve(uploadsArg)
    : process.env.BLOG_MEDIA_DIR || path.join(process.cwd(), "public", "uploads")
  const targetMusicDir = musicArg
    ? path.resolve(musicArg)
    : process.env.BLOG_MUSIC_DIR || path.join(process.cwd(), "public", "music")
  const restoreStamp = new Date().toISOString().replace(/[:.]/g, "-")

  fs.mkdirSync(targetDataDir, { recursive: true })

  if (fs.existsSync(targetDbPath)) {
    fs.copyFileSync(targetDbPath, `${targetDbPath}.backup-${restoreStamp}`)
  }

  if (fs.existsSync(uploadsSourceDir)) {
    if (fs.existsSync(targetUploadsDir)) {
      fs.cpSync(targetUploadsDir, `${targetUploadsDir}.backup-${restoreStamp}`, { recursive: true })
      fs.rmSync(targetUploadsDir, { recursive: true, force: true })
    }
    fs.cpSync(uploadsSourceDir, targetUploadsDir, { recursive: true })
  }

  if (fs.existsSync(musicSourceDir)) {
    if (fs.existsSync(targetMusicDir)) {
      fs.cpSync(targetMusicDir, `${targetMusicDir}.backup-${restoreStamp}`, { recursive: true })
      fs.rmSync(targetMusicDir, { recursive: true, force: true })
    }
    fs.cpSync(musicSourceDir, targetMusicDir, { recursive: true })
  }

  process.env.BLOG_DATA_DIR = targetDataDir
  process.env.BLOG_DB_PATH = targetDbPath
  process.env.BLOG_MEDIA_DIR = targetUploadsDir
  process.env.BLOG_MUSIC_DIR = targetMusicDir
  delete process.env.DATABASE_URL
  delete process.env.VERCEL
  delete process.env.BLOB_READ_WRITE_TOKEN

  const { ensureStoreReady, getDb } = await import("../src/lib/server/store-core")
  await ensureStoreReady()
  const db = getDb()

  const run = db.transaction(() => {
    db.prepare("DELETE FROM post_media_references").run()
    db.prepare("DELETE FROM post_versions").run()
    db.prepare("DELETE FROM comments").run()
    db.prepare("DELETE FROM user_music_library").run()
    db.prepare("DELETE FROM music_tracks").run()
    db.prepare("DELETE FROM users").run()
    db.prepare("DELETE FROM media_assets").run()
    db.prepare("DELETE FROM posts").run()
    db.prepare("DELETE FROM site_settings").run()
    db.prepare("DELETE FROM rate_limit_buckets").run()

    const insertPost = db.prepare(`
      INSERT INTO posts (id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, featured, draft, series, series_order, views, updated_at)
      VALUES (@id, @slug, @title, @excerpt, @date, @category, @tags_json, @content, @cover_image, @bgm_src, @pinned, @featured, @draft, @series, @series_order, @views, @updated_at)
    `)
    for (const post of snapshot.data.posts) {
      insertPost.run({
        id: post.id,
        slug: post.slug || post.id,
        title: post.title,
        excerpt: post.excerpt,
        date: post.date,
        category: post.category,
        tags_json: JSON.stringify(post.tags || []),
        content: post.content,
        cover_image: post.coverImage || "",
        bgm_src: post.bgmSrc || "",
        pinned: post.pinned ? 1 : 0,
        featured: post.featured ? 1 : 0,
        draft: post.draft ? 1 : 0,
        series: post.series || "",
        series_order: typeof post.seriesOrder === "number" ? post.seriesOrder : null,
        views: post.views || 0,
        updated_at: post.updatedAt || post.date,
      })
    }

    const insertPostVersion = db.prepare(`
      INSERT INTO post_versions (id, post_id, title, excerpt, content, category, tags_json, cover_image, bgm_src, pinned, featured, draft, series, series_order, created_at, note)
      VALUES (@id, @post_id, @title, @excerpt, @content, @category, @tags_json, @cover_image, @bgm_src, @pinned, @featured, @draft, @series, @series_order, @created_at, @note)
    `)
    for (const version of snapshot.data.postVersions) {
      insertPostVersion.run({
        id: version.id,
        post_id: version.postId,
        title: version.title,
        excerpt: version.excerpt,
        content: version.content,
        category: version.category,
        tags_json: JSON.stringify(version.tags || []),
        cover_image: version.coverImage || "",
        bgm_src: version.bgmSrc || "",
        pinned: version.pinned ? 1 : 0,
        featured: version.featured ? 1 : 0,
        draft: version.draft ? 1 : 0,
        series: version.series || "",
        series_order: typeof version.seriesOrder === "number" ? version.seriesOrder : null,
        created_at: version.createdAt,
        note: version.note || "",
      })
    }

    const insertComment = db.prepare(`
      INSERT INTO comments (id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at)
      VALUES (@id, @post_id, @author, @content, @date, @user_id, @parent_comment_id, @is_admin, @status, @moderation_note, @reviewed_at)
    `)
    for (const comment of snapshot.data.comments) {
      insertComment.run({
        id: comment.id,
        post_id: comment.postId,
        author: comment.author,
        content: comment.content,
        date: comment.date,
        user_id: comment.userId || null,
        parent_comment_id: comment.parentCommentId || null,
        is_admin: comment.isAdmin ? 1 : 0,
        status: comment.status || "approved",
        moderation_note: comment.moderationNote || null,
        reviewed_at: comment.reviewedAt || null,
      })
    }

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, display_name, password_hash, banned_at, ban_reason, created_at)
      VALUES (@id, @username, @display_name, @password_hash, @banned_at, @ban_reason, @created_at)
    `)
    for (const user of snapshot.data.users) {
      insertUser.run({
        id: user.id,
        username: user.username,
        display_name: user.displayName,
        password_hash: user.passwordHash,
        banned_at: user.bannedAt || null,
        ban_reason: user.banReason || null,
        created_at: user.createdAt,
      })
    }

    const insertUserMusic = db.prepare(`
      INSERT INTO user_music_library (user_id, favorite_srcs_json, recent_srcs_json, last_track_src, last_track_time, updated_at)
      VALUES (@user_id, @favorite_srcs_json, @recent_srcs_json, @last_track_src, @last_track_time, @updated_at)
    `)
    for (const library of snapshot.data.userMusicLibraries) {
      insertUserMusic.run({
        user_id: library.userId,
        favorite_srcs_json: JSON.stringify(library.favoriteSrcs || []),
        recent_srcs_json: JSON.stringify(library.recentSrcs || []),
        last_track_src: library.lastTrackSrc || null,
        last_track_time: library.lastTrackTime || 0,
        updated_at: library.updatedAt,
      })
    }

    const insertMusicTrack = db.prepare(`
      INSERT INTO music_tracks (id, name, pathname, url, storage, content_type, size, title, artist, album, cover_url, lyrics, uploaded_at, updated_at)
      VALUES (@id, @name, @pathname, @url, @storage, @content_type, @size, @title, @artist, @album, @cover_url, @lyrics, @uploaded_at, @updated_at)
    `)
    for (const track of snapshot.data.musicTracks || []) {
      insertMusicTrack.run({
        id: track.id,
        name: track.name,
        pathname: track.pathname,
        url: track.url,
        storage: track.storage,
        content_type: track.contentType,
        size: track.size,
        title: track.title,
        artist: track.artist,
        album: track.album || "",
        cover_url: track.coverUrl || "",
        lyrics: track.lyrics || "",
        uploaded_at: track.uploadedAt,
        updated_at: track.updatedAt,
      })
    }

    const insertMediaAsset = db.prepare(`
      INSERT INTO media_assets (id, name, pathname, url, storage, content_type, size, width, height, uploaded_at, updated_at)
      VALUES (@id, @name, @pathname, @url, @storage, @content_type, @size, @width, @height, @uploaded_at, @updated_at)
    `)
    for (const asset of snapshot.data.mediaAssets) {
      insertMediaAsset.run({
        id: asset.id,
        name: asset.name,
        pathname: asset.pathname,
        url: asset.url,
        storage: asset.storage,
        content_type: asset.contentType,
        size: asset.size,
        width: asset.width ?? null,
        height: asset.height ?? null,
        uploaded_at: asset.uploadedAt,
        updated_at: asset.updatedAt,
      })
    }

    const insertMediaReference = db.prepare(`
      INSERT INTO post_media_references (post_id, asset_id, usage_kind)
      VALUES (@post_id, @asset_id, @usage_kind)
    `)
    for (const reference of snapshot.data.mediaReferences) {
      insertMediaReference.run({
        post_id: reference.postId,
        asset_id: reference.assetId,
        usage_kind: reference.usageKind,
      })
    }

    const insertRateLimit = db.prepare(`
      INSERT INTO rate_limit_buckets (bucket, scope, actor_key, count, window_started_at, updated_at)
      VALUES (@bucket, @scope, @actor_key, @count, @window_started_at, @updated_at)
    `)
    for (const bucket of snapshot.data.rateLimitBuckets) {
      insertRateLimit.run({
        bucket: bucket.bucket,
        scope: bucket.scope,
        actor_key: bucket.actorKey,
        count: bucket.count,
        window_started_at: bucket.windowStartedAt,
        updated_at: bucket.updatedAt,
      })
    }

    db.prepare(`
      INSERT INTO site_settings (id, settings_json, updated_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at
    `).run(JSON.stringify(snapshot.data.siteSettings.settings), snapshot.data.siteSettings.updatedAt || snapshot.manifest.exportedAt)
  })

  run()

  console.log(`站点快照已恢复到: ${targetDbPath}`)
}

main().catch((error) => {
  console.error("恢复站点快照失败:", error)
  process.exit(1)
})
