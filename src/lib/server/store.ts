import { neon } from '@neondatabase/serverless'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import type { Post } from '@/lib/posts'

export interface CommentRecord {
  id: string
  postId: string
  author: string
  content: string
  date: string
  userId?: string | null
}

export interface PostVersionRecord {
  id: string
  postId: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  coverImage?: string
  bgmSrc?: string
  pinned?: boolean
  draft?: boolean
  createdAt: string
  note?: string
}

interface PostRow {
  id: string
  slug?: string | null
  title: string
  excerpt: string
  date: string
  category: string
  tags_json: string
  content: string
  cover_image?: string | null
  bgm_src?: string | null
  pinned: number | boolean
  draft: number | boolean
  views: number
  updated_at?: string | null
}

interface PostVersionRow {
  id: string
  post_id: string
  title: string
  excerpt: string
  content: string
  category: string
  tags_json: string
  cover_image?: string | null
  bgm_src?: string | null
  pinned: number | boolean
  draft: number | boolean
  created_at: string
  note?: string | null
}

interface UserRow {
  id: string
  username: string
  display_name: string
  password_hash: string
  created_at: string
}

interface CommentRow {
  id: string
  post_id: string
  author: string
  content: string
  date: string
  user_id?: string | null
}

interface CommentFileData {
  comments: Record<string, CommentRecord[]>
}

const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'blog.db')
const postsJsonPath = path.join(dataDir, 'posts/posts.json')
const commentsJsonPath = path.join(dataDir, 'comments.json')
const databaseUrl = process.env.DATABASE_URL

declare global {
  var __championBlogDb: Database.Database | undefined
  var __championBlogSql: ReturnType<typeof neon> | undefined
  var __championBlogStoreReady: Promise<void> | undefined
}

function isRemoteDatabaseEnabled() {
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

function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date,
    category: row.category,
    tags: JSON.parse(row.tags_json || '[]') as string[],
    content: row.content,
    coverImage: row.cover_image || '',
    bgmSrc: row.bgm_src || '',
    pinned: Boolean(row.pinned),
    draft: Boolean(row.draft),
    views: row.views || 0,
    updatedAt: row.updated_at || row.date,
  }
}

function rowToPostVersion(row: PostVersionRow): PostVersionRecord {
  return {
    id: row.id,
    postId: row.post_id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    tags: JSON.parse(row.tags_json || '[]') as string[],
    coverImage: row.cover_image || '',
    bgmSrc: row.bgm_src || '',
    pinned: Boolean(row.pinned),
    draft: Boolean(row.draft),
    createdAt: row.created_at,
    note: row.note || '',
  }
}

function rowToComment(row: CommentRow): CommentRecord {
  return {
    id: row.id,
    postId: row.post_id,
    author: row.author,
    content: row.content,
    date: row.date,
    userId: row.user_id || null,
  }
}

function normalizeExcerpt(content: string, excerpt?: string) {
  if (excerpt?.trim()) return excerpt.trim()
  return `${content.substring(0, 100)}...`
}

function normalizeTags(tags?: string[]) {
  return (tags || []).map((tag) => tag.trim()).filter(Boolean)
}

function slugify(value: string) {
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

function getDb() {
  if (!global.__championBlogDb) {
    ensureDataDir()
    const db = new Database(dbPath)
    db.pragma('journal_mode = WAL')

    db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        content TEXT NOT NULL,
        cover_image TEXT NOT NULL DEFAULT '',
        bgm_src TEXT NOT NULL DEFAULT '',
        pinned INTEGER NOT NULL DEFAULT 0,
        draft INTEGER NOT NULL DEFAULT 0,
        views INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        user_id TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

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
        draft INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT ''
      );

      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
      CREATE INDEX IF NOT EXISTS idx_post_versions_post_id ON post_versions(post_id);
    `)

    ensureSqliteColumn(db, 'posts', 'slug', "TEXT NOT NULL DEFAULT ''")
    ensureSqliteColumn(db, 'posts', 'cover_image', "TEXT NOT NULL DEFAULT ''")
    ensureSqliteColumn(db, 'posts', 'bgm_src', "TEXT NOT NULL DEFAULT ''")
    ensureSqliteColumn(db, 'posts', 'updated_at', "TEXT NOT NULL DEFAULT ''")
    ensureSqliteColumn(db, 'comments', 'user_id', 'TEXT')
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

    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number }
    if (postCount.count === 0) {
      const postsData = readJsonFile<{ posts: Post[] }>(postsJsonPath, { posts: [] })
      const insertPost = db.prepare(`
        INSERT INTO posts (id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views, updated_at)
        VALUES (@id, @slug, @title, @excerpt, @date, @category, @tags_json, @content, @cover_image, @bgm_src, @pinned, @draft, @views, @updated_at)
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
            draft: post.draft ? 1 : 0,
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
        INSERT INTO comments (id, post_id, author, content, date, user_id)
        VALUES (@id, @post_id, @author, @content, @date, @user_id)
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
          })
        }
      })

      insertMany(Object.values(commentsData.comments).flat())
    }

    global.__championBlogDb = db
  }

  return global.__championBlogDb
}

function getSql() {
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
      INSERT INTO posts (id, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views)
      VALUES (${post.id}, ${post.title}, ${post.excerpt}, ${post.date}, ${post.category}, ${JSON.stringify(post.tags || [])}, ${post.content}, ${post.coverImage || ''}, ${post.bgmSrc || ''}, ${post.pinned ? 1 : 0}, ${post.draft ? 1 : 0}, ${post.views || 0})
      ON CONFLICT (id) DO NOTHING
    `
  }

  for (const comment of Object.values(commentsData.comments).flat()) {
    await sql`
      INSERT INTO comments (id, post_id, author, content, date, user_id)
      VALUES (${comment.id}, ${comment.postId}, ${comment.author}, ${comment.content}, ${comment.date}, ${comment.userId || null})
      ON CONFLICT (id) DO NOTHING
    `
  }
}

async function ensureRemoteSchema() {
  const sql = getSql()

  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      content TEXT NOT NULL,
      cover_image TEXT NOT NULL DEFAULT '',
      bgm_src TEXT NOT NULL DEFAULT '',
      pinned INTEGER NOT NULL DEFAULT 0,
      draft INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      user_id TEXT
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
      draft INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    )
  `

  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS bgm_src TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id TEXT`
  await sql`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`
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

  const postCountRows = (await sql`SELECT COUNT(*)::int AS count FROM posts`) as Array<{ count: number }>
  if (Number(postCountRows[0]?.count || 0) === 0) {
    await seedRemoteDatabase()
  }
}

async function ensureStoreReady() {
  if (!isRemoteDatabaseEnabled()) {
    getDb()
    return
  }

  if (!global.__championBlogStoreReady) {
    global.__championBlogStoreReady = ensureRemoteSchema()
  }

  await global.__championBlogStoreReady
}

export async function listPosts(options?: { includeDrafts?: boolean }) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = ((options?.includeDrafts ?? true)
      ? await sql`SELECT id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views, updated_at FROM posts ORDER BY pinned DESC, date DESC`
      : await sql`SELECT id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views, updated_at FROM posts WHERE draft = 0 ORDER BY pinned DESC, date DESC`) as PostRow[]

    return rows.map(rowToPost)
  }

  const includeDrafts = options?.includeDrafts ?? true
  const rows = getDb().prepare(`
    SELECT id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views, updated_at
    FROM posts
    ${includeDrafts ? '' : 'WHERE draft = 0'}
    ORDER BY pinned DESC, date DESC
  `).all() as PostRow[]

  return rows.map(rowToPost)
}

export async function getPostById(id: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views, updated_at
      FROM posts
      WHERE id = ${id}
      LIMIT 1
    `) as PostRow[]
    return rows[0] ? rowToPost(rows[0]) : undefined
  }

  const row = getDb().prepare(`
    SELECT id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views, updated_at
    FROM posts
    WHERE id = ?
    LIMIT 1
  `).get(id) as PostRow | undefined
  return row ? rowToPost(row) : undefined
}

export async function createPost(input: {
  slug?: string
  title: string
  excerpt?: string
  content: string
  category?: string
  tags?: string[]
  coverImage?: string
  bgmSrc?: string
  draft?: boolean
  pinned?: boolean
}) {
  await ensureStoreReady()

  const baseSlug = slugify(input.slug || input.title) || `post-${Date.now()}`
  let slug = baseSlug
  let suffix = 1
  while (await getPostBySlug(slug)) {
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  const now = new Date().toISOString()

  const post: Post = {
    id: `${slug}-${Date.now()}`,
    slug,
    title: input.title,
    excerpt: normalizeExcerpt(input.content, input.excerpt),
    date: new Date().toISOString().split('T')[0],
    category: input.category?.trim() || '未分类',
    tags: normalizeTags(input.tags),
    content: input.content,
    coverImage: input.coverImage?.trim() || '',
    bgmSrc: input.bgmSrc?.trim() || '',
    pinned: Boolean(input.pinned),
    draft: Boolean(input.draft),
    views: 0,
    updatedAt: now,
  }

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO posts (id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views, updated_at)
      VALUES (${post.id}, ${post.slug || post.id}, ${post.title}, ${post.excerpt}, ${post.date}, ${post.category}, ${JSON.stringify(post.tags)}, ${post.content}, ${post.coverImage || ''}, ${post.bgmSrc || ''}, ${post.pinned ? 1 : 0}, ${post.draft ? 1 : 0}, ${post.views || 0}, ${post.updatedAt || now})
    `
    await savePostVersion(post.id, post, '初始版本')
    return post
  }

  getDb().prepare(`
    INSERT INTO posts (id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views, updated_at)
    VALUES (@id, @slug, @title, @excerpt, @date, @category, @tags_json, @content, @cover_image, @bgm_src, @pinned, @draft, @views, @updated_at)
  `).run({
    ...post,
    slug: post.slug || post.id,
    tags_json: JSON.stringify(post.tags),
    cover_image: post.coverImage || '',
    bgm_src: post.bgmSrc || '',
    pinned: post.pinned ? 1 : 0,
    draft: post.draft ? 1 : 0,
    updated_at: post.updatedAt || now,
  })

  await savePostVersion(post.id, post, '初始版本')

  return post
}

export async function updatePost(
  id: string,
  patch: Partial<Pick<Post, 'slug' | 'title' | 'excerpt' | 'content' | 'category' | 'tags' | 'coverImage' | 'bgmSrc' | 'pinned' | 'draft'>>
) {
  const existing = await getPostById(id)
  if (!existing) return undefined

  const requestedSlug = typeof patch.slug === 'string' ? slugify(patch.slug) : existing.slug || existing.id
  let nextSlug = requestedSlug || existing.slug || existing.id
  if (nextSlug !== (existing.slug || existing.id)) {
    let suffix = 1
    const baseSlug = nextSlug
    while (true) {
      const matched = await getPostBySlug(nextSlug)
      if (!matched || matched.id === id) break
      nextSlug = `${baseSlug}-${suffix}`
      suffix += 1
    }
  }
  const next: Post = {
    ...existing,
    ...patch,
    slug: nextSlug,
    excerpt: normalizeExcerpt(patch.content ?? existing.content, patch.excerpt ?? existing.excerpt),
    category: patch.category?.trim() || existing.category,
    tags: patch.tags ? normalizeTags(patch.tags) : existing.tags,
    coverImage: typeof patch.coverImage === 'string' ? patch.coverImage.trim() : existing.coverImage || '',
    bgmSrc: typeof patch.bgmSrc === 'string' ? patch.bgmSrc.trim() : existing.bgmSrc || '',
    updatedAt: new Date().toISOString(),
  }

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await savePostVersion(id, existing, patch.draft && !existing.draft ? '保存草稿' : '编辑更新')
    await sql`
      UPDATE posts
      SET slug = ${next.slug || next.id},
          title = ${next.title},
          excerpt = ${next.excerpt},
          category = ${next.category},
          tags_json = ${JSON.stringify(next.tags)},
          content = ${next.content},
          cover_image = ${next.coverImage || ''},
          bgm_src = ${next.bgmSrc || ''},
          pinned = ${next.pinned ? 1 : 0},
          draft = ${next.draft ? 1 : 0},
          updated_at = ${next.updatedAt || new Date().toISOString()}
      WHERE id = ${id}
    `
    return next
  }

  await savePostVersion(id, existing, patch.draft && !existing.draft ? '保存草稿' : '编辑更新')
  getDb().prepare(`
    UPDATE posts
    SET slug = @slug,
        title = @title,
        excerpt = @excerpt,
        category = @category,
        tags_json = @tags_json,
        content = @content,
        cover_image = @cover_image,
        bgm_src = @bgm_src,
        pinned = @pinned,
        draft = @draft,
        updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    slug: next.slug || next.id,
    title: next.title,
    excerpt: next.excerpt,
    category: next.category,
    tags_json: JSON.stringify(next.tags),
    content: next.content,
    cover_image: next.coverImage || '',
    bgm_src: next.bgmSrc || '',
    pinned: next.pinned ? 1 : 0,
    draft: next.draft ? 1 : 0,
    updated_at: next.updatedAt || new Date().toISOString(),
  })

  return next
}

export async function deletePost(id: string) {
  const post = await getPostById(id)
  if (!post) return false

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`DELETE FROM comments WHERE post_id = ${id}`
    await sql`DELETE FROM posts WHERE id = ${id}`
    return true
  }

  const db = getDb()
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(id)
    db.prepare('DELETE FROM posts WHERE id = ?').run(id)
  })
  tx()

  return true
}

export async function incrementPostViews(id: string) {
  const existing = await getPostById(id)
  if (!existing) return undefined

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      UPDATE posts
      SET views = views + 1
      WHERE id = ${id}
      RETURNING views
    `) as Array<{ views: number }>
    return Number(rows[0]?.views || 0)
  }

  const db = getDb()
  db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(id)
  const updated = db.prepare('SELECT views FROM posts WHERE id = ?').get(id) as { views: number } | undefined
  return updated?.views || 0
}

export async function listCommentsByPost(postId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, post_id, author, content, date, user_id
      FROM comments
      WHERE post_id = ${postId}
      ORDER BY date DESC, id DESC
    `) as CommentRow[]
    return rows.map(rowToComment)
  }

  const rows = getDb().prepare(`
    SELECT id, post_id, author, content, date, user_id
    FROM comments
    WHERE post_id = ?
    ORDER BY date DESC, id DESC
  `).all(postId) as CommentRow[]

  return rows.map(rowToComment)
}

export async function listRecentComments(limit = 10) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, post_id, author, content, date, user_id
      FROM comments
      ORDER BY date DESC, id DESC
      LIMIT ${limit}
    `) as CommentRow[]
    return rows.map(rowToComment)
  }

  const rows = getDb().prepare(`
    SELECT id, post_id, author, content, date, user_id
    FROM comments
    ORDER BY date DESC, id DESC
    LIMIT ?
  `).all(limit) as CommentRow[]

  return rows.map(rowToComment)
}

export async function createComment(input: { postId: string; author: string; content: string; userId?: string | null }) {
  await ensureStoreReady()

  const comment: CommentRecord = {
    id: Date.now().toString(),
    postId: input.postId,
    author: input.author.trim(),
    content: input.content.trim(),
    date: new Date().toISOString().split('T')[0],
    userId: input.userId || null,
  }

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO comments (id, post_id, author, content, date, user_id)
      VALUES (${comment.id}, ${comment.postId}, ${comment.author}, ${comment.content}, ${comment.date}, ${comment.userId || null})
    `
    return comment
  }

  getDb().prepare(`
    INSERT INTO comments (id, post_id, author, content, date, user_id)
    VALUES (@id, @post_id, @author, @content, @date, @user_id)
  `).run({
    id: comment.id,
    post_id: comment.postId,
    author: comment.author,
    content: comment.content,
    date: comment.date,
    user_id: comment.userId || null,
  })

  return comment
}

export async function getCommentById(postId: string, commentId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, post_id, author, content, date, user_id
      FROM comments
      WHERE id = ${commentId} AND post_id = ${postId}
      LIMIT 1
    `) as CommentRow[]
    return rows[0] ? rowToComment(rows[0]) : undefined
  }

  const row = getDb().prepare(`
    SELECT id, post_id, author, content, date, user_id
    FROM comments
    WHERE id = ? AND post_id = ?
    LIMIT 1
  `).get(commentId, postId) as CommentRow | undefined

  return row ? rowToComment(row) : undefined
}

export async function getPostBySlug(slug: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views, updated_at
      FROM posts
      WHERE slug = ${slug}
      LIMIT 1
    `) as PostRow[]
    return rows[0] ? rowToPost(rows[0]) : undefined
  }

  const row = getDb().prepare(`
    SELECT id, slug, title, excerpt, date, category, tags_json, content, cover_image, bgm_src, pinned, draft, views, updated_at
    FROM posts
    WHERE slug = ?
    LIMIT 1
  `).get(slug) as PostRow | undefined
  return row ? rowToPost(row) : undefined
}

export async function savePostVersion(postId: string, post: Post, note = '') {
  await ensureStoreReady()
  const versionId = `${postId}-${Date.now()}`
  const createdAt = new Date().toISOString()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO post_versions (id, post_id, title, excerpt, content, category, tags_json, cover_image, bgm_src, pinned, draft, created_at, note)
      VALUES (${versionId}, ${postId}, ${post.title}, ${post.excerpt}, ${post.content}, ${post.category}, ${JSON.stringify(post.tags || [])}, ${post.coverImage || ''}, ${post.bgmSrc || ''}, ${post.pinned ? 1 : 0}, ${post.draft ? 1 : 0}, ${createdAt}, ${note})
    `
    return
  }

  getDb().prepare(`
    INSERT INTO post_versions (id, post_id, title, excerpt, content, category, tags_json, cover_image, bgm_src, pinned, draft, created_at, note)
    VALUES (@id, @post_id, @title, @excerpt, @content, @category, @tags_json, @cover_image, @bgm_src, @pinned, @draft, @created_at, @note)
  `).run({
    id: versionId,
    post_id: postId,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    tags_json: JSON.stringify(post.tags || []),
    cover_image: post.coverImage || '',
    bgm_src: post.bgmSrc || '',
    pinned: post.pinned ? 1 : 0,
    draft: post.draft ? 1 : 0,
    created_at: createdAt,
    note,
  })
}

export async function listPostVersions(postId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, post_id, title, excerpt, content, category, tags_json, cover_image, bgm_src, pinned, draft, created_at, note
      FROM post_versions
      WHERE post_id = ${postId}
      ORDER BY created_at DESC
      LIMIT 20
    `) as PostVersionRow[]
    return rows.map(rowToPostVersion)
  }

  const rows = getDb().prepare(`
    SELECT id, post_id, title, excerpt, content, category, tags_json, cover_image, bgm_src, pinned, draft, created_at, note
    FROM post_versions
    WHERE post_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(postId) as PostVersionRow[]
  return rows.map(rowToPostVersion)
}

export async function getPostVersion(postId: string, versionId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, post_id, title, excerpt, content, category, tags_json, cover_image, bgm_src, pinned, draft, created_at, note
      FROM post_versions
      WHERE post_id = ${postId} AND id = ${versionId}
      LIMIT 1
    `) as PostVersionRow[]
    return rows[0] ? rowToPostVersion(rows[0]) : undefined
  }

  const row = getDb().prepare(`
    SELECT id, post_id, title, excerpt, content, category, tags_json, cover_image, bgm_src, pinned, draft, created_at, note
    FROM post_versions
    WHERE post_id = ? AND id = ?
    LIMIT 1
  `).get(postId, versionId) as PostVersionRow | undefined
  return row ? rowToPostVersion(row) : undefined
}

export async function deleteComment(postId: string, commentId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      DELETE FROM comments
      WHERE id = ${commentId} AND post_id = ${postId}
      RETURNING id
    `) as Array<{ id: string }>
    return rows.length > 0
  }

  const result = getDb().prepare('DELETE FROM comments WHERE id = ? AND post_id = ?').run(commentId, postId)
  return result.changes > 0
}

export async function getUserByUsername(username: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, username, display_name, password_hash, created_at
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `) as UserRow[]
    return rows[0]
  }

  return getDb().prepare(`
    SELECT id, username, display_name, password_hash, created_at
    FROM users
    WHERE username = ?
    LIMIT 1
  `).get(username) as UserRow | undefined
}

export async function createUser(input: { id: string; username: string; displayName: string; passwordHash: string }) {
  await ensureStoreReady()

  const createdAt = new Date().toISOString()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO users (id, username, display_name, password_hash, created_at)
      VALUES (${input.id}, ${input.username}, ${input.displayName}, ${input.passwordHash}, ${createdAt})
    `
    return { ...input, createdAt }
  }

  getDb().prepare(`
    INSERT INTO users (id, username, display_name, password_hash, created_at)
    VALUES (@id, @username, @display_name, @password_hash, @created_at)
  `).run({
    id: input.id,
    username: input.username,
    display_name: input.displayName,
    password_hash: input.passwordHash,
    created_at: createdAt,
  })

  return { ...input, createdAt }
}
