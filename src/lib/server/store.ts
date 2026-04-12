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
}

interface PostRow {
  id: string
  title: string
  excerpt: string
  date: string
  category: string
  tags_json: string
  content: string
  pinned: number | boolean
  draft: number | boolean
  views: number
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
    title: row.title,
    excerpt: row.excerpt,
    date: row.date,
    category: row.category,
    tags: JSON.parse(row.tags_json || '[]') as string[],
    content: row.content,
    pinned: Boolean(row.pinned),
    draft: Boolean(row.draft),
    views: row.views || 0,
  }
}

function normalizeExcerpt(content: string, excerpt?: string) {
  if (excerpt?.trim()) return excerpt.trim()
  return `${content.substring(0, 100)}...`
}

function normalizeTags(tags?: string[]) {
  return (tags || []).map((tag) => tag.trim()).filter(Boolean)
}

function getDb() {
  if (!global.__championBlogDb) {
    ensureDataDir()
    const db = new Database(dbPath)
    db.pragma('journal_mode = WAL')

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
        draft INTEGER NOT NULL DEFAULT 0,
        views INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    `)

    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number }
    if (postCount.count === 0) {
      const postsData = readJsonFile<{ posts: Post[] }>(postsJsonPath, { posts: [] })
      const insertPost = db.prepare(`
        INSERT INTO posts (id, title, excerpt, date, category, tags_json, content, pinned, draft, views)
        VALUES (@id, @title, @excerpt, @date, @category, @tags_json, @content, @pinned, @draft, @views)
      `)

      const insertMany = db.transaction((posts: Post[]) => {
        for (const post of posts) {
          insertPost.run({
            id: post.id,
            title: post.title,
            excerpt: post.excerpt,
            date: post.date,
            category: post.category,
            tags_json: JSON.stringify(post.tags || []),
            content: post.content,
            pinned: post.pinned ? 1 : 0,
            draft: post.draft ? 1 : 0,
            views: post.views || 0,
          })
        }
      })

      insertMany(postsData.posts)
    }

    const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments').get() as { count: number }
    if (commentCount.count === 0) {
      const commentsData = readJsonFile<CommentFileData>(commentsJsonPath, { comments: {} })
      const insertComment = db.prepare(`
        INSERT INTO comments (id, post_id, author, content, date)
        VALUES (@id, @post_id, @author, @content, @date)
      `)

      const insertMany = db.transaction((records: CommentRecord[]) => {
        for (const comment of records) {
          insertComment.run({
            id: comment.id,
            post_id: comment.postId,
            author: comment.author,
            content: comment.content,
            date: comment.date,
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
      INSERT INTO posts (id, title, excerpt, date, category, tags_json, content, pinned, draft, views)
      VALUES (${post.id}, ${post.title}, ${post.excerpt}, ${post.date}, ${post.category}, ${JSON.stringify(post.tags || [])}, ${post.content}, ${post.pinned ? 1 : 0}, ${post.draft ? 1 : 0}, ${post.views || 0})
      ON CONFLICT (id) DO NOTHING
    `
  }

  for (const comment of Object.values(commentsData.comments).flat()) {
    await sql`
      INSERT INTO comments (id, post_id, author, content, date)
      VALUES (${comment.id}, ${comment.postId}, ${comment.author}, ${comment.content}, ${comment.date})
      ON CONFLICT (id) DO NOTHING
    `
  }
}

async function ensureRemoteSchema() {
  const sql = getSql()

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
      draft INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`

  const postCountRows = (await sql`SELECT COUNT(*)::int AS count FROM posts`) as Array<{ count: number }>
  const postCount = Number(postCountRows[0]?.count || 0)
  if (postCount === 0) {
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
      ? await sql`SELECT id, title, excerpt, date, category, tags_json, content, pinned, draft, views FROM posts ORDER BY pinned DESC, date DESC`
      : await sql`SELECT id, title, excerpt, date, category, tags_json, content, pinned, draft, views FROM posts WHERE draft = 0 ORDER BY pinned DESC, date DESC`) as PostRow[]

    return rows.map((row) => rowToPost(row as unknown as PostRow))
  }

  const includeDrafts = options?.includeDrafts ?? true
  const rows = getDb().prepare(`
    SELECT * FROM posts
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
      SELECT id, title, excerpt, date, category, tags_json, content, pinned, draft, views
      FROM posts
      WHERE id = ${id}
      LIMIT 1
    `) as PostRow[]
    return rows[0] ? rowToPost(rows[0] as unknown as PostRow) : undefined
  }

  const row = getDb().prepare('SELECT * FROM posts WHERE id = ?').get(id) as PostRow | undefined
  return row ? rowToPost(row) : undefined
}

export async function createPost(input: {
  title: string
  excerpt?: string
  content: string
  category?: string
  tags?: string[]
  draft?: boolean
  pinned?: boolean
}) {
  await ensureStoreReady()

  const post: Post = {
    id: `${input.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-').replace(/-+/g, '-')}-${Date.now()}`,
    title: input.title,
    excerpt: normalizeExcerpt(input.content, input.excerpt),
    date: new Date().toISOString().split('T')[0],
    category: input.category?.trim() || '未分类',
    tags: normalizeTags(input.tags),
    content: input.content,
    pinned: Boolean(input.pinned),
    draft: Boolean(input.draft),
    views: 0,
  }

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO posts (id, title, excerpt, date, category, tags_json, content, pinned, draft, views)
      VALUES (${post.id}, ${post.title}, ${post.excerpt}, ${post.date}, ${post.category}, ${JSON.stringify(post.tags)}, ${post.content}, ${post.pinned ? 1 : 0}, ${post.draft ? 1 : 0}, ${post.views || 0})
    `
    return post
  }

  getDb().prepare(`
    INSERT INTO posts (id, title, excerpt, date, category, tags_json, content, pinned, draft, views)
    VALUES (@id, @title, @excerpt, @date, @category, @tags_json, @content, @pinned, @draft, @views)
  `).run({
    ...post,
    tags_json: JSON.stringify(post.tags),
    pinned: post.pinned ? 1 : 0,
    draft: post.draft ? 1 : 0,
  })

  return post
}

export async function updatePost(
  id: string,
  patch: Partial<Pick<Post, 'title' | 'excerpt' | 'content' | 'category' | 'tags' | 'pinned' | 'draft'>>
) {
  const existing = await getPostById(id)
  if (!existing) return undefined

  const next: Post = {
    ...existing,
    ...patch,
    excerpt: normalizeExcerpt(patch.content ?? existing.content, patch.excerpt ?? existing.excerpt),
    category: patch.category?.trim() || existing.category,
    tags: patch.tags ? normalizeTags(patch.tags) : existing.tags,
  }

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      UPDATE posts
      SET title = ${next.title},
          excerpt = ${next.excerpt},
          category = ${next.category},
          tags_json = ${JSON.stringify(next.tags)},
          content = ${next.content},
          pinned = ${next.pinned ? 1 : 0},
          draft = ${next.draft ? 1 : 0}
      WHERE id = ${id}
    `
    return next
  }

  getDb().prepare(`
    UPDATE posts
    SET title = @title,
        excerpt = @excerpt,
        category = @category,
        tags_json = @tags_json,
        content = @content,
        pinned = @pinned,
        draft = @draft
    WHERE id = @id
  `).run({
    id,
    title: next.title,
    excerpt: next.excerpt,
    category: next.category,
    tags_json: JSON.stringify(next.tags),
    content: next.content,
    pinned: next.pinned ? 1 : 0,
    draft: next.draft ? 1 : 0,
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
      SELECT id, post_id, author, content, date
      FROM comments
      WHERE post_id = ${postId}
      ORDER BY date DESC, id DESC
    `) as Array<{ id: string; post_id: string; author: string; content: string; date: string }>

    return rows.map((row) => ({
      id: String(row.id),
      postId: String(row.post_id),
      author: String(row.author),
      content: String(row.content),
      date: String(row.date),
    }))
  }

  const rows = getDb().prepare(`
    SELECT id, post_id, author, content, date
    FROM comments
    WHERE post_id = ?
    ORDER BY date DESC, id DESC
  `).all(postId) as Array<{ id: string; post_id: string; author: string; content: string; date: string }>

  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    author: row.author,
    content: row.content,
    date: row.date,
  }))
}

export async function listRecentComments(limit = 10) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT id, post_id, author, content, date
      FROM comments
      ORDER BY date DESC, id DESC
      LIMIT ${limit}
    `) as Array<{ id: string; post_id: string; author: string; content: string; date: string }>

    return rows.map((row) => ({
      id: String(row.id),
      postId: String(row.post_id),
      author: String(row.author),
      content: String(row.content),
      date: String(row.date),
    }))
  }

  const rows = getDb().prepare(`
    SELECT id, post_id, author, content, date
    FROM comments
    ORDER BY date DESC, id DESC
    LIMIT ?
  `).all(limit) as Array<{ id: string; post_id: string; author: string; content: string; date: string }>

  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    author: row.author,
    content: row.content,
    date: row.date,
  }))
}

export async function createComment(input: { postId: string; author: string; content: string }) {
  await ensureStoreReady()

  const comment: CommentRecord = {
    id: Date.now().toString(),
    postId: input.postId,
    author: input.author.trim(),
    content: input.content.trim(),
    date: new Date().toISOString().split('T')[0],
  }

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO comments (id, post_id, author, content, date)
      VALUES (${comment.id}, ${comment.postId}, ${comment.author}, ${comment.content}, ${comment.date})
    `
    return comment
  }

  getDb().prepare(`
    INSERT INTO comments (id, post_id, author, content, date)
    VALUES (@id, @post_id, @author, @content, @date)
  `).run({
    id: comment.id,
    post_id: comment.postId,
    author: comment.author,
    content: comment.content,
    date: comment.date,
  })

  return comment
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
