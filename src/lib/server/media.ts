import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

export interface MediaAsset {
  id: string
  name: string
  url: string
  size: number
  updatedAt: string
}

const mediaDir = path.join(process.cwd(), 'public/uploads')
const allowedMimeTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/svg+xml', '.svg'],
])

export function canWriteMediaLibrary() {
  return !process.env.VERCEL
}

export function getMediaLibraryWarning() {
  if (canWriteMediaLibrary()) return null
  return '当前 Vercel 运行环境是只读文件系统，后台可以正常查看媒体库，但暂不支持在线上传或删除本地素材。'
}

function ensureMediaDirForWrite() {
  if (!canWriteMediaLibrary()) {
    throw new Error('当前部署环境不支持直接写入本地媒体库，请后续接入对象存储。')
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

export async function listMediaAssets(): Promise<MediaAsset[]> {
  if (!fs.existsSync(mediaDir)) {
    return []
  }

  return fs
    .readdirSync(mediaDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const absolutePath = path.join(mediaDir, entry.name)
      const stats = fs.statSync(absolutePath)
      return {
        id: entry.name,
        name: entry.name,
        url: `/uploads/${encodeURIComponent(entry.name)}`,
        size: stats.size,
        updatedAt: stats.mtime.toISOString(),
      } satisfies MediaAsset
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export async function saveMediaFile(file: File) {
  ensureMediaDirForWrite()

  const extension = allowedMimeTypes.get(file.type)
  if (!extension) {
    throw new Error('当前只支持上传常见图片格式')
  }

  const baseName = sanitizeBaseName(file.name) || 'image'
  const fileName = `${baseName}-${randomUUID().slice(0, 8)}${extension}`
  const absolutePath = path.join(mediaDir, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())

  fs.writeFileSync(absolutePath, buffer)

  const stats = fs.statSync(absolutePath)
  return {
    id: fileName,
    name: fileName,
    url: `/uploads/${encodeURIComponent(fileName)}`,
    size: stats.size,
    updatedAt: stats.mtime.toISOString(),
  } satisfies MediaAsset
}

export async function deleteMediaFile(fileName: string) {
  if (!canWriteMediaLibrary()) {
    throw new Error('当前部署环境不支持直接删除本地媒体库素材，请后续接入对象存储。')
  }

  if (!fs.existsSync(mediaDir)) return false
  const safeName = path.basename(fileName)
  const absolutePath = path.join(mediaDir, safeName)
  if (!fs.existsSync(absolutePath)) return false
  fs.unlinkSync(absolutePath)
  return true
}
