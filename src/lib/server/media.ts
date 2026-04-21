import { randomUUID } from 'crypto'
import { del, list as listBlobs, put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import {
  deleteMediaAssetRecord,
  getMediaAssetRecordById,
  getMediaAssetRecordByName,
  isRemoteDatabaseEnabled,
  listMediaAssetRecords,
  upsertMediaAssetRecord,
} from '@/lib/server/store'

export interface MediaAsset {
  id: string
  name: string
  pathname: string
  url: string
  size: number
  contentType: string
  updatedAt: string
  storage: 'local' | 'blob'
  deletable: boolean
}

const mediaDir = process.env.BLOG_MEDIA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), 'public/uploads')
const allowedMimeTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/svg+xml', '.svg'],
])

function canWriteLocalMediaLibrary() {
  return !process.env.VERCEL
}

function isBlobMediaLibraryEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export function canWriteMediaLibrary() {
  return canWriteLocalMediaLibrary() || isBlobMediaLibraryEnabled()
}

export function getMediaLibraryWarning() {
  if (canWriteMediaLibrary()) return null
  if (process.env.VERCEL) {
    return '当前线上媒体库未配置 BLOB_READ_WRITE_TOKEN，暂时只能查看随代码部署的素材。配置 Vercel Blob 后即可在线上传和删除。'
  }
  return null
}

function ensureMediaDirForWrite() {
  if (!canWriteLocalMediaLibrary()) {
    throw new Error('当前环境不支持直接写入本地媒体库，请改用 Vercel Blob。')
  }

  fs.mkdirSync(mediaDir, { recursive: true })
}

function sanitizeBaseName(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

function createAssetName(fileName: string) {
  return path.basename(fileName)
}

function toLocalAsset(fileName: string, stats: fs.Stats, contentType = 'image/*'): MediaAsset {
  return {
    id: fileName,
    name: createAssetName(fileName),
    pathname: fileName,
    url: `/uploads/${encodeURIComponent(fileName)}`,
    size: stats.size,
    contentType,
    updatedAt: stats.mtime.toISOString(),
    storage: 'local',
    deletable: canWriteLocalMediaLibrary(),
  }
}

async function listStaticMediaAssets(): Promise<MediaAsset[]> {
  if (!fs.existsSync(mediaDir)) {
    return []
  }

  return fs
    .readdirSync(mediaDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const absolutePath = path.join(mediaDir, entry.name)
      const stats = fs.statSync(absolutePath)
      return toLocalAsset(entry.name, stats)
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function toStoredAsset(record: Awaited<ReturnType<typeof listMediaAssetRecords>>[number]): MediaAsset {
  return {
    id: record.id,
    name: record.name,
    pathname: record.pathname,
    url: record.url,
    size: record.size,
    contentType: record.contentType,
    updatedAt: record.updatedAt,
    storage: record.storage,
    deletable: record.storage === 'blob' ? isBlobMediaLibraryEnabled() : canWriteLocalMediaLibrary(),
  }
}

async function listBlobMediaAssets(): Promise<MediaAsset[]> {
  if (isRemoteDatabaseEnabled()) {
    const storedAssets = await listMediaAssetRecords()
    return storedAssets
      .filter((asset) => asset.storage === 'blob')
      .map(toStoredAsset)
  }

  const result = await listBlobs({ prefix: 'media-library/' })
  return result.blobs.map((blob) => ({
    id: blob.pathname,
    name: createAssetName(blob.pathname),
    pathname: blob.pathname,
    url: blob.url,
    size: blob.size,
    contentType: 'image/*',
    updatedAt: blob.uploadedAt.toISOString(),
    storage: 'blob',
    deletable: true,
  }))
}

export async function listMediaAssets(): Promise<MediaAsset[]> {
  const staticAssets = await listStaticMediaAssets()

  if (!isBlobMediaLibraryEnabled()) {
    return staticAssets
  }

  const storedAssets = await listBlobMediaAssets()

  const seenPathnames = new Set(storedAssets.map((asset) => asset.pathname))
  const merged = [
    ...storedAssets,
    ...staticAssets.filter((asset) => !seenPathnames.has(asset.pathname)),
  ]

  return merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export async function saveMediaFile(file: File) {
  const extension = allowedMimeTypes.get(file.type)
  if (!extension) {
    throw new Error('当前只支持上传常见图片格式')
  }

  const baseName = sanitizeBaseName(file.name) || 'image'

  if (isBlobMediaLibraryEnabled()) {
    const uploadedAt = new Date().toISOString()
    const pathname = `media-library/${baseName}${extension}`
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    })

    const nextAsset = {
      id: blob.pathname,
      name: createAssetName(blob.pathname),
      pathname: blob.pathname,
      url: blob.url,
      storage: 'blob' as const,
      contentType: blob.contentType || file.type,
      size: file.size,
      uploadedAt,
      updatedAt: uploadedAt,
    }

    if (isRemoteDatabaseEnabled()) {
      const asset = await upsertMediaAssetRecord(nextAsset)
      return toStoredAsset(asset)
    }

    return {
      ...nextAsset,
      deletable: true,
    } satisfies MediaAsset
  }

  ensureMediaDirForWrite()

  const fileName = `${baseName}-${randomUUID().slice(0, 8)}${extension}`
  const absolutePath = path.join(mediaDir, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())

  fs.writeFileSync(absolutePath, buffer)

  const stats = fs.statSync(absolutePath)
  return {
    id: fileName,
    name: createAssetName(fileName),
    pathname: fileName,
    url: `/uploads/${encodeURIComponent(fileName)}`,
    size: stats.size,
    contentType: file.type,
    updatedAt: stats.mtime.toISOString(),
    storage: 'local',
    deletable: true,
  } satisfies MediaAsset
}

export async function deleteMediaFile(identifier: string) {
  const safeIdentifier = path.basename(identifier)
  const localPath = path.join(mediaDir, safeIdentifier)

  if (canWriteLocalMediaLibrary() && fs.existsSync(localPath)) {
    fs.unlinkSync(localPath)
    return true
  }

  if (isBlobMediaLibraryEnabled()) {
    if (!isRemoteDatabaseEnabled()) {
      await del(identifier)
      return true
    }

    const asset = await getMediaAssetRecordById(identifier) ?? await getMediaAssetRecordByName(safeIdentifier)
    if (!asset) {
      return false
    }
    if (asset.storage !== 'blob') {
      throw new Error('当前环境不能删除随代码部署的本地素材。')
    }

    await del(asset.pathname)
    await deleteMediaAssetRecord(asset.id)
    return true
  }

  if (process.env.VERCEL) {
    throw new Error('当前线上媒体库未配置 Vercel Blob，暂不支持在线删除素材。')
  }

  return false
}
