import fs from 'fs'
import path from 'path'
import type { Post } from '@/lib/posts'
import { ensureStoreReady, getDb, getSql, isRemoteDatabaseEnabled } from './store-core'
import { listMediaAssetRecords } from './store-user-media'

type UsageKind = 'cover' | 'content' | 'cover+content'

interface PostMediaReferenceInput {
  assetId: string
  usageKind: UsageKind
}

export interface PostMediaReferenceDetail {
  assetId: string
  postId: string
  postTitle: string
  postSlug?: string | null
  draft: boolean
  kind: UsageKind
}

interface MatchableAsset {
  id: string
  url: string
  pathname?: string
}

const localMediaDirSegments = ['public', 'uploads'] as const

function getLocalMediaDir() {
  if (process.env.BLOG_MEDIA_DIR) {
    return process.env.BLOG_MEDIA_DIR
  }

  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    ...localMediaDirSegments
  )
}

function listLocalMatchableAssets(): MatchableAsset[] {
  const mediaDir = getLocalMediaDir()

  if (!fs.existsSync(mediaDir)) {
    return []
  }

  return fs
    .readdirSync(mediaDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      id: entry.name,
      pathname: entry.name,
      url: `/uploads/${encodeURIComponent(entry.name)}`,
    }))
}

async function listMatchableAssets(): Promise<MatchableAsset[]> {
  const localAssets = listLocalMatchableAssets()
  const storedAssets = await listMediaAssetRecords()

  const seenIds = new Set(storedAssets.map((asset) => asset.id))
  return [
    ...storedAssets.map((asset) => ({
      id: asset.id,
      pathname: asset.pathname,
      url: asset.url,
    })),
    ...localAssets.filter((asset) => !seenIds.has(asset.id)),
  ]
}

function buildPostMediaReferenceInputs(post: Pick<Post, 'coverImage' | 'content'>, assets: MatchableAsset[]) {
  const references: PostMediaReferenceInput[] = []

  for (const asset of assets) {
    const usesAsCover = Boolean(post.coverImage && post.coverImage === asset.url)
    const usesInContent =
      post.content.includes(asset.url) ||
      Boolean(asset.pathname && post.content.includes(asset.pathname))

    if (!usesAsCover && !usesInContent) continue

    references.push({
      assetId: asset.id,
      usageKind: usesAsCover && usesInContent ? 'cover+content' : usesAsCover ? 'cover' : 'content',
    })
  }

  return references
}

async function replacePostMediaReferences(postId: string, references: PostMediaReferenceInput[]) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`DELETE FROM post_media_references WHERE post_id = ${postId}`
    for (const reference of references) {
      await sql`
        INSERT INTO post_media_references (post_id, asset_id, usage_kind)
        VALUES (${postId}, ${reference.assetId}, ${reference.usageKind})
        ON CONFLICT (post_id, asset_id) DO UPDATE SET usage_kind = EXCLUDED.usage_kind
      `
    }
    return
  }

  const db = getDb()
  const tx = db.transaction((items: PostMediaReferenceInput[]) => {
    db.prepare('DELETE FROM post_media_references WHERE post_id = ?').run(postId)
    const statement = db.prepare(`
      INSERT INTO post_media_references (post_id, asset_id, usage_kind)
      VALUES (?, ?, ?)
      ON CONFLICT(post_id, asset_id) DO UPDATE SET usage_kind = excluded.usage_kind
    `)
    for (const reference of items) {
      statement.run(postId, reference.assetId, reference.usageKind)
    }
  })

  tx(references)
}

export async function syncPostMediaReferences(post: Pick<Post, 'id' | 'coverImage' | 'content'>) {
  const assets = await listMatchableAssets()
  const references = buildPostMediaReferenceInputs(post, assets)
  await replacePostMediaReferences(post.id, references)
}

export async function syncAllPostMediaReferences(posts: Array<Pick<Post, 'id' | 'coverImage' | 'content'>>) {
  const assets = await listMatchableAssets()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`DELETE FROM post_media_references`
    for (const post of posts) {
      const references = buildPostMediaReferenceInputs(post, assets)
      for (const reference of references) {
        await sql`
          INSERT INTO post_media_references (post_id, asset_id, usage_kind)
          VALUES (${post.id}, ${reference.assetId}, ${reference.usageKind})
          ON CONFLICT (post_id, asset_id) DO UPDATE SET usage_kind = EXCLUDED.usage_kind
        `
      }
    }
    return
  }

  const db = getDb()
  const tx = db.transaction((items: Array<Pick<Post, 'id' | 'coverImage' | 'content'>>) => {
    db.prepare('DELETE FROM post_media_references').run()
    const statement = db.prepare(`
      INSERT INTO post_media_references (post_id, asset_id, usage_kind)
      VALUES (?, ?, ?)
      ON CONFLICT(post_id, asset_id) DO UPDATE SET usage_kind = excluded.usage_kind
    `)

    for (const post of items) {
      const references = buildPostMediaReferenceInputs(post, assets)
      for (const reference of references) {
        statement.run(post.id, reference.assetId, reference.usageKind)
      }
    }
  })

  tx(posts)
}

export async function deletePostMediaReferences(postId: string) {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`DELETE FROM post_media_references WHERE post_id = ${postId}`
    return
  }

  getDb().prepare('DELETE FROM post_media_references WHERE post_id = ?').run(postId)
}

export async function listPostMediaReferenceDetails() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    return (await sql`
      SELECT
        r.asset_id,
        r.post_id,
        r.usage_kind,
        p.title AS post_title,
        p.slug AS post_slug,
        p.draft
      FROM post_media_references r
      JOIN posts p ON p.id = r.post_id
    `) as Array<{
      asset_id: string
      post_id: string
      usage_kind: UsageKind
      post_title: string
      post_slug?: string | null
      draft: number | boolean
    }>
  }

  return getDb().prepare(`
    SELECT
      r.asset_id,
      r.post_id,
      r.usage_kind,
      p.title AS post_title,
      p.slug AS post_slug,
      p.draft
    FROM post_media_references r
    JOIN posts p ON p.id = r.post_id
  `).all() as Array<{
    asset_id: string
    post_id: string
    usage_kind: UsageKind
    post_title: string
    post_slug?: string | null
    draft: number | boolean
  }>
}
