import { neon } from '@neondatabase/serverless'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import type { Post } from '@/lib/posts'
import type { CommentRecord, CommentStatus } from './store-types'

interface CommentFileData {
  comments: Record<string, CommentRecord[]>
}

const dataDir = process.env.BLOG_DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), 'data')
const dbPath = process.env.BLOG_DB_PATH || path.join(dataDir, 'blog.db')
const postsJsonPath = process.env.BLOG_POSTS_JSON_PATH || path.join(dataDir, 'posts/posts.json')
const commentsJsonPath = process.env.BLOG_COMMENTS_JSON_PATH || path.join(dataDir, 'comments.json')
const databaseUrl = process.env.DATABASE_URL

declare global {
  var __championBlogDb: Database.Database | undefined
  var __championBlogSql: ReturnType<typeof neon> | undefined
  var __championBlogStoreReady: Promise<void> | undefined
}

export function isRemoteDatabaseEnabled() {
  return Boolean(databaseUrl)
}

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true })
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch {
    return fallback
  }
}

export function normalizeExcerpt(content: string, excerpt?: string) {
  if (excerpt?.trim()) return excerpt.trim()
  return `${content.substring(0, 100)}...`
}

export function normalizeTags(tags?: string[]) {
  return (tags || []).map((tag) => tag.trim()).filter(Boolean)
}

export function normalizeSeries(series?: string | null) {
  return series?.trim() || ''
}

export function normalizeSeriesOrder(value?: number | string | null) {
  const next = Number(value)
  if (!Number.isFinite(next) || next < 1) return null
  return Math.floor(next)
}

export function normalizeCommentStatus(status?: string | null): CommentStatus {
  return status === 'pending' || status === 'rejected' ? status : 'approved'
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function ensureSqliteColumn(db: Database.Database, tableName: string, columnName: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`)
  }
}

function ensureSqliteMigrationsTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `)
}

function runSqliteMigration(db: Database.Database, id: string, apply: () => void) {
  ensureSqliteMigrationsTable(db)
  const existing = db.prepare('SELECT id FROM schema_migrations WHERE id = ? LIMIT 1').get(id) as { id: string } | undefined
  if (existing) return

  const run = db.transaction(() => {
    apply()
    db.prepare('INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(id, new Date().toISOString())
  })

  run()
}

async function ensureRemoteMigrationsTable() {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `
}

async function hasRemoteMigration(id: string) {
  const sql = getSql()
  const rows = (await sql`SELECT id FROM schema_migrations WHERE id = ${id} LIMIT 1`) as Array<{ id: string }>
  return Boolean(rows[0]?.id)
}

async function runRemoteMigration(id: string, apply: () => Promise<void>) {
  await ensureRemoteMigrationsTable()
  if (await hasRemoteMigration(id)) return
  await apply()
  const sql = getSql()
  await sql`INSERT INTO schema_migrations (id, applied_at) VALUES (${id}, ${new Date().toISOString()})`
}

function syncSqliteSeedContent(db: Database.Database) {
  const postsData = readJsonFile<{ posts: Post[] }>(postsJsonPath, { posts: [] })
  const commentsData = readJsonFile<CommentFileData>(commentsJsonPath, { comments: {} })
  const insertPost = db.prepare(`
    INSERT OR IGNORE INTO posts (id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, featured, draft, series, series_order, views, updated_at)
    VALUES (@id, @slug, @title, @excerpt, @date, @category, @tags_json, @content, @cover_image, @bgm_src, @pinned, @featured, @draft, @series, @series_order, @views, @updated_at)
  `)
  const insertComment = db.prepare(`
    INSERT OR IGNORE INTO comments (id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status, moderation_note, reviewed_at)
    VALUES (@id, @post_id, @author, @content, @date, @user_id, @parent_comment_id, @is_admin, @status, @moderation_note, @reviewed_at)
  `)

  const syncSeeds = db.transaction(() => {
    for (const post of postsData.posts) {
      insertPost.run({
        id: post.id,
        slug: post.slug || post.id,
        title: post.title,
        excerpt: post.excerpt,
        date: post.date,
        category: post.category,
        tags_json: JSON.stringify(post.tags || []),
        content: post.content,
        cover_image: post.coverImage || '',
        bgm_src: post.bgmSrc || '',
        pinned: post.pinned ? 1 : 0,
        featured: post.featured ? 1 : 0,
        draft: post.draft ? 1 : 0,
        series: post.series || '',
        series_order: normalizeSeriesOrder(post.seriesOrder),
        views: post.views || 0,
        updated_at: post.updatedAt || post.date,
      })
    }

    for (const comment of Object.values(commentsData.comments).flat()) {
      insertComment.run({
        id: comment.id,
        post_id: comment.postId,
        author: comment.author,
        content: comment.content,
        date: comment.date,
        user_id: comment.userId || null,
        parent_comment_id: comment.parentCommentId || null,
        is_admin: comment.isAdmin ? 1 : 0,
        status: normalizeCommentStatus(comment.status),
        moderation_note: comment.moderationNote || null,
        reviewed_at: comment.status === 'pending' ? null : new Date().toISOString(),
      })
    }
  })

  syncSeeds()
}

const legacyInlineImageSeedCleanup = {
  id: 'hhh',
  title: '关于图片种子清理的一次记录',
  excerpt: '这是一篇保留下来的旧种子文章说明，用来替代早期那条带超大 base64 图片的测试内容。',
  content:
    '<p>这篇文章原本只是一次图片导入测试，正文里直接塞进了一整张 base64 图片，不适合作为长期保留的种子内容。</p>\n' +
    '<p>现在我把它整理成一篇简短说明，保留这条记录本身，但去掉对仓库体积和初始化速度影响很大的内嵌图片数据。</p>\n' +
    '<p>如果后面还想继续保留配图，更合适的做法是先上传到站内媒体库，再在正文里引用媒体库 URL。</p>',
}

function applyLegacyInlineImageSeedCleanupSqlite(db: Database.Database) {
  db.prepare(`
    UPDATE posts
    SET title = @title,
        excerpt = @excerpt,
        content = @content,
        updated_at = @updated_at
    WHERE id = @id
      AND content LIKE '%data:image/%'
  `).run({
    ...legacyInlineImageSeedCleanup,
    updated_at: new Date().toISOString(),
  })
}

async function applyLegacyInlineImageSeedCleanupRemote() {
  const sql = getSql()
  await sql`
    UPDATE posts
    SET title = ${legacyInlineImageSeedCleanup.title},
        excerpt = ${legacyInlineImageSeedCleanup.excerpt},
        content = ${legacyInlineImageSeedCleanup.content},
        updated_at = ${new Date().toISOString()}
    WHERE id = ${legacyInlineImageSeedCleanup.id}
      AND content LIKE ${'%data:image/%'}
  `
}

export function getDb() {
  if (!global.__championBlogDb) {
    ensureDataDir()
    const db = new Database(dbPath)
    db.pragma('journal_mode = WAL')

    runSqliteMigration(db, '001-core-schema', () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          date TEXT NOT NULL,
          category TEXT NOT NULL,
          tags_json TEXT NOT NULL DEFAULT '[]',
          content TEXT NOT NULL,
          pinned INTEGER NOT NULL DEFAULT 0,
          featured INTEGER NOT NULL DEFAULT 0,
          draft INTEGER NOT NULL DEFAULT 0,
          series TEXT NOT NULL DEFAULT '',
          series_order INTEGER,
          views INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          post_id TEXT NOT NULL,
          author TEXT NOT NULL,
          content TEXT NOT NULL,
          date TEXT NOT NULL,
          parent_comment_id TEXT,
          is_admin INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `)
    })

    runSqliteMigration(db, '002-post-metadata-and-versions', () => {
      ensureSqliteColumn(db, 'posts', 'slug', "TEXT NOT NULL DEFAULT ''")
      ensureSqliteColumn(db, 'posts', 'cover_image', "TEXT NOT NULL DEFAULT ''")
      ensureSqliteColumn(db, 'posts', 'bgm_src', "TEXT NOT NULL DEFAULT ''")
      ensureSqliteColumn(db, 'posts', 'updated_at', "TEXT NOT NULL DEFAULT ''")
      db.exec(`
        CREATE TABLE IF NOT EXISTS post_versions (
          id TEXT PRIMARY KEY,
          post_id TEXT NOT NULL,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          tags_json TEXT NOT NULL DEFAULT '[]',
          cover_image TEXT NOT NULL DEFAULT '',
          bgm_src TEXT NOT NULL DEFAULT '',
          pinned INTEGER NOT NULL DEFAULT 0,
          featured INTEGER NOT NULL DEFAULT 0,
          draft INTEGER NOT NULL DEFAULT 0,
          series TEXT NOT NULL DEFAULT '',
          series_order INTEGER,
          created_at TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
        CREATE INDEX IF NOT EXISTS idx_post_versions_post_id ON post_versions(post_id);
      `)
      db.prepare(`
        UPDATE posts
        SET slug = CASE
          WHEN slug IS NULL OR slug = '' THEN lower(trim(replace(title, ' ', '-')))
          ELSE slug
        END,
            updated_at = CASE
          WHEN updated_at IS NULL OR updated_at = '' THEN date
          ELSE updated_at
        END
      `).run()
    })

    runSqliteMigration(db, '003-comment-moderation', () => {
      ensureSqliteColumn(db, 'comments', 'user_id', 'TEXT')
      ensureSqliteColumn(db, 'comments', 'status', "TEXT NOT NULL DEFAULT 'approved'")
      ensureSqliteColumn(db, 'comments', 'moderation_note', 'TEXT')
      ensureSqliteColumn(db, 'comments', 'reviewed_at', 'TEXT')
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
        CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
      `)
      db.prepare(`
        UPDATE comments
        SET status = CASE
          WHEN status IS NULL OR status = '' THEN 'approved'
          ELSE status
        END
      `).run()
    })

    runSqliteMigration(db, '004-user-music-library', () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_music_library (
          user_id TEXT PRIMARY KEY,
          favorite_srcs_json TEXT NOT NULL DEFAULT '[]',
          recent_srcs_json TEXT NOT NULL DEFAULT '[]',
          updated_at TEXT NOT NULL
        );
      `)
    })

    runSqliteMigration(db, '005-user-music-resume', () => {
      ensureSqliteColumn(db, 'user_music_library', 'last_track_src', 'TEXT')
      ensureSqliteColumn(db, 'user_music_library', 'last_track_time', 'REAL NOT NULL DEFAULT 0')
    })

    runSqliteMigration(db, '006-user-moderation', () => {
      ensureSqliteColumn(db, 'users', 'banned_at', 'TEXT')
      ensureSqliteColumn(db, 'users', 'ban_reason', 'TEXT')
    })

    runSqliteMigration(db, '007-comment-threading', () => {
      ensureSqliteColumn(db, 'comments', 'parent_comment_id', 'TEXT')
      ensureSqliteColumn(db, 'comments', 'is_admin', 'INTEGER NOT NULL DEFAULT 0')
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
      `)
    })

    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number }
    if (postCount.count === 0) {
      const postsData = readJsonFile<{ posts: Post[] }>(postsJsonPath, { posts: [] })
      const insertPost = db.prepare(`
        INSERT INTO posts (id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, featured, draft, series, series_order, views, updated_at)
        VALUES (@id, @slug, @title, @excerpt, @date, @category, @tags_json, @content, @cover_image, @bgm_src, @pinned, @featured, @draft, @series, @series_order, @views, @updated_at)
      `)

      const insertMany = db.transaction((posts: Post[]) => {
        for (const post of posts) {
          insertPost.run({
            id: post.id,
            slug: post.slug || post.id,
            title: post.title,
            excerpt: post.excerpt,
            date: post.date,
            category: post.category,
            tags_json: JSON.stringify(post.tags || []),
            content: post.content,
            cover_image: post.coverImage || '',
            bgm_src: post.bgmSrc || '',
            pinned: post.pinned ? 1 : 0,
            featured: post.featured ? 1 : 0,
            draft: post.draft ? 1 : 0,
            series: post.series || '',
            series_order: normalizeSeriesOrder(post.seriesOrder),
            views: post.views || 0,
            updated_at: post.updatedAt || post.date,
          })
        }
      })

      insertMany(postsData.posts)
    }

    const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments').get() as { count: number }
    if (commentCount.count === 0) {
      const commentsData = readJsonFile<CommentFileData>(commentsJsonPath, { comments: {} })
      const insertComment = db.prepare(`
        INSERT INTO comments (id, post_id, author, content, date, user_id, parent_comment_id, is_admin)
        VALUES (@id, @post_id, @author, @content, @date, @user_id, @parent_comment_id, @is_admin)
      `)

      const insertMany = db.transaction((records: CommentRecord[]) => {
        for (const comment of records) {
          insertComment.run({
            id: comment.id,
            post_id: comment.postId,
            author: comment.author,
            content: comment.content,
            date: comment.date,
            user_id: comment.userId || null,
            parent_comment_id: comment.parentCommentId || null,
            is_admin: comment.isAdmin ? 1 : 0,
          })
        }
      })

      insertMany(Object.values(commentsData.comments).flat())
    }

    runSqliteMigration(db, '008-seed-content-sync', () => {
      syncSqliteSeedContent(db)
    })

    runSqliteMigration(db, '009-longform-seed-sync', () => {
      syncSqliteSeedContent(db)
    })

    runSqliteMigration(db, '010-media-assets', () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS media_assets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          pathname TEXT NOT NULL UNIQUE,
          url TEXT NOT NULL,
          storage TEXT NOT NULL,
          content_type TEXT NOT NULL,
          size INTEGER NOT NULL DEFAULT 0,
          width INTEGER,
          height INTEGER,
          uploaded_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_media_assets_updated_at ON media_assets(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_media_assets_name ON media_assets(name);
      `)
    })

    runSqliteMigration(db, '011-post-content-structure', () => {
      ensureSqliteColumn(db, 'posts', 'featured', 'INTEGER NOT NULL DEFAULT 0')
      ensureSqliteColumn(db, 'posts', 'series', "TEXT NOT NULL DEFAULT ''")
      ensureSqliteColumn(db, 'posts', 'series_order', 'INTEGER')
      ensureSqliteColumn(db, 'post_versions', 'featured', 'INTEGER NOT NULL DEFAULT 0')
      ensureSqliteColumn(db, 'post_versions', 'series', "TEXT NOT NULL DEFAULT ''")
      ensureSqliteColumn(db, 'post_versions', 'series_order', 'INTEGER')
    })

    runSqliteMigration(db, '012-site-settings', () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          settings_json TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `)
    })

    runSqliteMigration(db, '013-clean-inline-image-seed', () => {
      applyLegacyInlineImageSeedCleanupSqlite(db)
    })

    runSqliteMigration(db, '014-rate-limit-buckets', () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS rate_limit_buckets (
          bucket TEXT PRIMARY KEY,
          scope TEXT NOT NULL,
          actor_key TEXT NOT NULL,
          count INTEGER NOT NULL DEFAULT 0,
          window_started_at INTEGER NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_scope_updated_at
          ON rate_limit_buckets(scope, updated_at DESC);
      `)
    })

    runSqliteMigration(db, '015-media-asset-dimensions', () => {
      ensureSqliteColumn(db, 'media_assets', 'width', 'INTEGER')
      ensureSqliteColumn(db, 'media_assets', 'height', 'INTEGER')
    })

    runSqliteMigration(db, '016-post-media-references', () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS post_media_references (
          post_id TEXT NOT NULL,
          asset_id TEXT NOT NULL,
          usage_kind TEXT NOT NULL,
          PRIMARY KEY (post_id, asset_id)
        );
        CREATE INDEX IF NOT EXISTS idx_post_media_references_asset_id
          ON post_media_references(asset_id);
      `)
    })

    global.__championBlogDb = db
  }

  return global.__championBlogDb
}

export function getSql() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured')
  }

  if (!global.__championBlogSql) {
    global.__championBlogSql = neon(databaseUrl)
  }

  return global.__championBlogSql
}

async function seedRemoteDatabase() {
  const sql = getSql()
  const postsData = readJsonFile<{ posts: Post[] }>(postsJsonPath, { posts: [] })
  const commentsData = readJsonFile<CommentFileData>(commentsJsonPath, { comments: {} })

  for (const post of postsData.posts) {
    await sql`
      INSERT INTO posts (id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, featured, draft, series, series_order, views, updated_at)
      VALUES (${post.id}, ${post.slug || slugify(post.title) || post.id}, ${post.title}, ${post.excerpt}, ${post.date}, ${post.category}, ${JSON.stringify(post.tags || [])}, ${post.content}, ${post.coverImage || ''}, ${post.bgmSrc || ''}, ${post.pinned ? 1 : 0}, ${post.featured ? 1 : 0}, ${post.draft ? 1 : 0}, ${post.series || ''}, ${normalizeSeriesOrder(post.seriesOrder)}, ${post.views || 0}, ${post.updatedAt || post.date})
      ON CONFLICT (id) DO NOTHING
    `
  }

  for (const comment of Object.values(commentsData.comments).flat()) {
    await sql`
      INSERT INTO comments (id, post_id, author, content, date, user_id, parent_comment_id, is_admin, status)
      VALUES (${comment.id}, ${comment.postId}, ${comment.author}, ${comment.content}, ${comment.date}, ${comment.userId || null}, ${comment.parentCommentId || null}, ${comment.isAdmin ? 1 : 0}, ${comment.status || 'approved'})
      ON CONFLICT (id) DO NOTHING
    `
  }
}

async function ensureRemoteSchema() {
  const sql = getSql()

  await runRemoteMigration('001-core-schema', async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        content TEXT NOT NULL,
        pinned INTEGER NOT NULL DEFAULT 0,
        featured INTEGER NOT NULL DEFAULT 0,
        draft INTEGER NOT NULL DEFAULT 0,
        series TEXT NOT NULL DEFAULT '',
        series_order INTEGER,
        views INTEGER NOT NULL DEFAULT 0
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        parent_comment_id TEXT,
        is_admin INTEGER NOT NULL DEFAULT 0
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `
  })

  await runRemoteMigration('002-post-metadata-and-versions', async () => {
    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT ''`
    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image TEXT NOT NULL DEFAULT ''`
    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS bgm_src TEXT NOT NULL DEFAULT ''`
    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TEXT NOT NULL DEFAULT ''`
    await sql`
      CREATE TABLE IF NOT EXISTS post_versions (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        cover_image TEXT NOT NULL DEFAULT '',
        bgm_src TEXT NOT NULL DEFAULT '',
        pinned INTEGER NOT NULL DEFAULT 0,
        featured INTEGER NOT NULL DEFAULT 0,
        draft INTEGER NOT NULL DEFAULT 0,
        series TEXT NOT NULL DEFAULT '',
        series_order INTEGER,
        created_at TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT ''
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`
    await sql`CREATE INDEX IF NOT EXISTS idx_post_versions_post_id ON post_versions(post_id)`
    await sql`
      UPDATE posts
      SET slug = CASE
        WHEN slug = '' THEN lower(replace(title, ' ', '-'))
        ELSE slug
      END,
          updated_at = CASE
        WHEN updated_at = '' THEN date
        ELSE updated_at
      END
    `
  })

  await runRemoteMigration('003-comment-moderation', async () => {
    await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id TEXT`
    await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'`
    await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderation_note TEXT`
    await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS reviewed_at TEXT`
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)`
    await sql`UPDATE comments SET status = 'approved' WHERE status IS NULL OR status = ''`
  })

  await runRemoteMigration('004-user-music-library', async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS user_music_library (
        user_id TEXT PRIMARY KEY,
        favorite_srcs_json TEXT NOT NULL DEFAULT '[]',
        recent_srcs_json TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
      )
    `
  })

  await runRemoteMigration('005-user-music-resume', async () => {
    await sql`ALTER TABLE user_music_library ADD COLUMN IF NOT EXISTS last_track_src TEXT`
    await sql`ALTER TABLE user_music_library ADD COLUMN IF NOT EXISTS last_track_time REAL NOT NULL DEFAULT 0`
  })

  await runRemoteMigration('006-user-moderation', async () => {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TEXT`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT`
  })

  await runRemoteMigration('007-comment-threading', async () => {
    await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id TEXT`
    await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_admin INTEGER NOT NULL DEFAULT 0`
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id)`
  })

  await runRemoteMigration('008-seed-content-sync', async () => {
    await seedRemoteDatabase()
  })

  await runRemoteMigration('009-longform-seed-sync', async () => {
    await seedRemoteDatabase()
  })

  await runRemoteMigration('010-media-assets', async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pathname TEXT NOT NULL UNIQUE,
        url TEXT NOT NULL,
        storage TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size INTEGER NOT NULL DEFAULT 0,
        width INTEGER,
        height INTEGER,
        uploaded_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_media_assets_updated_at ON media_assets(updated_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_media_assets_name ON media_assets(name)`
  })

  await runRemoteMigration('011-post-content-structure', async () => {
    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured INTEGER NOT NULL DEFAULT 0`
    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS series TEXT NOT NULL DEFAULT ''`
    await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS series_order INTEGER`
    await sql`ALTER TABLE post_versions ADD COLUMN IF NOT EXISTS featured INTEGER NOT NULL DEFAULT 0`
    await sql`ALTER TABLE post_versions ADD COLUMN IF NOT EXISTS series TEXT NOT NULL DEFAULT ''`
    await sql`ALTER TABLE post_versions ADD COLUMN IF NOT EXISTS series_order INTEGER`
  })

  await runRemoteMigration('012-site-settings', async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY,
        settings_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `
  })

  await runRemoteMigration('013-clean-inline-image-seed', async () => {
    await applyLegacyInlineImageSeedCleanupRemote()
  })

  await runRemoteMigration('014-rate-limit-buckets', async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        bucket TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        actor_key TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        window_started_at BIGINT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_scope_updated_at ON rate_limit_buckets(scope, updated_at DESC)`
  })

  await runRemoteMigration('015-media-asset-dimensions', async () => {
    await sql`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS width INTEGER`
    await sql`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS height INTEGER`
  })

  await runRemoteMigration('016-post-media-references', async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS post_media_references (
        post_id TEXT NOT NULL,
        asset_id TEXT NOT NULL,
        usage_kind TEXT NOT NULL,
        PRIMARY KEY (post_id, asset_id)
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_post_media_references_asset_id ON post_media_references(asset_id)`
  })

  const postCountRows = (await sql`SELECT COUNT(*)::int AS count FROM posts`) as Array<{ count: number }>
  if (Number(postCountRows[0]?.count || 0) === 0) {
    await seedRemoteDatabase()
  }
}

export async function ensureStoreReady() {
  if (!isRemoteDatabaseEnabled()) {
    getDb()
    return
  }

  if (!global.__championBlogStoreReady) {
    global.__championBlogStoreReady = ensureRemoteSchema()
  }

  await global.__championBlogStoreReady
}
