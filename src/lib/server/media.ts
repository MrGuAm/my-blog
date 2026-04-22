import { randomUUID } from 'crypto'
import { del, list as listBlobs, put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { MEDIA_UPLOAD_MIME_TYPE_SET } from '@/lib/media-upload'
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
  width?: number | null
  height?: number | null
  contentType: string
  updatedAt: string
  storage: 'local' | 'blob'
  deletable: boolean
}

const localMediaDirSegments = ['public', 'uploads'] as const
const allowedMimeTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/svg+xml', '.svg'],
])
const optimizableMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function canWriteLocalMediaLibrary() {
  return !process.env.VERCEL
}

function isBlobMediaLibraryEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function getLocalMediaDir() {
  if (process.env.BLOG_MEDIA_DIR) {
    return process.env.BLOG_MEDIA_DIR
  }

  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    ...localMediaDirSegments,
  )
}

function getLocalMediaPath(fileName: string) {
  return path.join(getLocalMediaDir(), fileName)
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

  fs.mkdirSync(getLocalMediaDir(), { recursive: true })
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

async function prepareImageUpload(file: File) {
  const sourceBuffer = Buffer.from(await file.arrayBuffer())

  if (!optimizableMimeTypes.has(file.type)) {
    const extension = allowedMimeTypes.get(file.type)
    if (!extension) {
      throw new Error('当前只支持上传常见图片格式')
    }
    const metadata = await getImageDimensions(sourceBuffer)
    return {
      buffer: sourceBuffer,
      contentType: file.type,
      extension,
      width: metadata.width,
      height: metadata.height,
    }
  }

  let optimizedBuffer: Buffer
  try {
    optimizedBuffer = await sharp(sourceBuffer)
      .rotate()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    throw new Error('图片内容无法解析，请重新导出后再试')
  }
  const optimizedMetadata = await getImageDimensions(optimizedBuffer)

  return {
    buffer: optimizedBuffer,
    contentType: 'image/webp',
    extension: '.webp',
    width: optimizedMetadata.width,
    height: optimizedMetadata.height,
  }
}

async function getImageDimensions(source: Buffer | string) {
  try {
    const metadata = await sharp(source, { animated: true }).metadata()
    return {
      width: typeof metadata.width === 'number' ? metadata.width : null,
      height: typeof metadata.height === 'number' ? metadata.height : null,
    }
  } catch {
    return { width: null, height: null }
  }
}

function toLocalAsset(
  fileName: string,
  stats: fs.Stats,
  options?: { contentType?: string; width?: number | null; height?: number | null }
): MediaAsset {
  return {
    id: fileName,
    name: createAssetName(fileName),
    pathname: fileName,
    url: `/uploads/${encodeURIComponent(fileName)}`,
    size: stats.size,
    width: options?.width ?? null,
    height: options?.height ?? null,
    contentType: options?.contentType || 'image/*',
    updatedAt: stats.mtime.toISOString(),
    storage: 'local',
    deletable: canWriteLocalMediaLibrary(),
  }
}

async function listStaticMediaAssets(): Promise<MediaAsset[]> {
  const mediaDir = getLocalMediaDir()

  if (!fs.existsSync(mediaDir)) {
    return []
  }

  const assets = await Promise.all(
    fs
      .readdirSync(mediaDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const absolutePath = getLocalMediaPath(entry.name)
        const stats = fs.statSync(absolutePath)
        const dimensions = await getImageDimensions(absolutePath)
        return toLocalAsset(entry.name, stats, dimensions)
      })
  )

  return assets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function toStoredAsset(record: Awaited<ReturnType<typeof listMediaAssetRecords>>[number]): MediaAsset {
  return {
    id: record.id,
    name: record.name,
    pathname: record.pathname,
    url: record.url,
    size: record.size,
    width: record.width ?? null,
    height: record.height ?? null,
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
    width: null,
    height: null,
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
  if (!MEDIA_UPLOAD_MIME_TYPE_SET.has(file.type)) {
    throw new Error('当前只支持上传常见图片格式')
  }

  const prepared = await prepareImageUpload(file)
  const baseName = sanitizeBaseName(file.name) || 'image'

  if (isBlobMediaLibraryEnabled()) {
    const uploadedAt = new Date().toISOString()
    const pathname = `media-library/${baseName}${prepared.extension}`
    const blob = await put(pathname, prepared.buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: prepared.contentType,
    })

    const nextAsset = {
      id: blob.pathname,
      name: createAssetName(blob.pathname),
      pathname: blob.pathname,
      url: blob.url,
      storage: 'blob' as const,
      contentType: blob.contentType || prepared.contentType,
      size: prepared.buffer.byteLength,
      width: prepared.width ?? null,
      height: prepared.height ?? null,
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

  const fileName = `${baseName}-${randomUUID().slice(0, 8)}${prepared.extension}`
  const absolutePath = getLocalMediaPath(fileName)

  fs.writeFileSync(absolutePath, prepared.buffer)

  const stats = fs.statSync(absolutePath)
  return {
    id: fileName,
    name: createAssetName(fileName),
    pathname: fileName,
    url: `/uploads/${encodeURIComponent(fileName)}`,
    size: stats.size,
    width: prepared.width ?? null,
    height: prepared.height ?? null,
    contentType: prepared.contentType,
    updatedAt: stats.mtime.toISOString(),
    storage: 'local',
    deletable: true,
  } satisfies MediaAsset
}

export async function deleteMediaFile(identifier: string) {
  const safeIdentifier = path.basename(identifier)
  const localPath = getLocalMediaPath(safeIdentifier)

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
