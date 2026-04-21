import type { Post } from '@/lib/posts'
import {
  ensureStoreReady,
  getDb,
  getSql,
  isRemoteDatabaseEnabled,
  normalizeCommentStatus,
  normalizeExcerpt,
  normalizeTags,
  slugify,
} from './store-core'
import {
  rowToComment,
  rowToPost,
  rowToPostVersion,
  type CommentRecord,
  type CommentRow,
  type CommentStatus,
  type MediaAssetRecord,
  type PostRow,
  type PostVersionRecord,
  type PostVersionRow,
  type UserMusicLibrary,
  type UserRecord,
} from './store-types'
export {
  createUser,
  deleteMediaAssetRecord,
  deleteUserAccount,
  getMediaAssetRecordById,
  getMediaAssetRecordByName,
  getUserById,
  getUserByUsername,
  getUserMusicLibrary,
  listMediaAssetRecords,
  listUsers,
  setUserBanState,
  upsertMediaAssetRecord,
  upsertUserMusicLibrary,
} from './store-user-media'
export {
  ensureStoreReady,
  getDb,
  getSql,
  isRemoteDatabaseEnabled,
  normalizeCommentStatus,
  rowToComment,
}
export type {
  CommentRecord,
  CommentRow,
  CommentStatus,
  MediaAssetRecord,
  PostVersionRecord,
  UserMusicLibrary,
  UserRecord,
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
