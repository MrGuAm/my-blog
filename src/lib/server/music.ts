import { randomUUID } from "crypto"
import { del, put } from "@vercel/blob"
import fs from "fs"
import path from "path"
import sharp from "sharp"
import { parseBuffer } from "music-metadata"
import {
  buildManagedMusicPath,
  getMusicUploadExtension,
  getMusicUploadExtensionByType,
  sanitizeMusicBaseName,
  validateMusicUploadInput,
} from "@/lib/music-upload"
import { invalidateMusicCache } from "@/lib/server/site-cache"
import {
  deleteMusicTrackRecord,
  getMusicTrackRecordById,
  getMusicTrackRecordByPathname,
  listMusicTrackRecords,
  upsertMusicTrackRecord,
  type MusicTrackRecord,
} from "@/lib/server/store"

export interface MusicTrack {
  title: string
  artist: string
  src: string
  album?: string
  coverUrl?: string
  lyrics?: string
}

export interface ManagedMusicTrack extends MusicTrack {
  id: string
  name: string
  pathname: string
  storage: "local" | "blob"
  contentType: string
  size: number
  uploadedAt: string
  updatedAt: string
  deletable: boolean
}

const localMusicDirSegments = ["public", "music"] as const
const supportedExtensions = new Set([".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"])

function canWriteLocalMusicLibrary() {
  return !process.env.VERCEL
}

function isBlobMusicLibraryEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export function canWriteMusicLibrary() {
  return canWriteLocalMusicLibrary() || isBlobMusicLibraryEnabled()
}

export function canUseDirectBlobMusicUpload() {
  return isBlobMusicLibraryEnabled()
}

export function getMusicLibraryWarning() {
  if (canWriteMusicLibrary()) return null
  if (process.env.VERCEL) {
    return "当前线上曲库未配置可写存储，暂时只能播放随代码部署的音乐文件。配置 Vercel Blob 后即可在线上传和删除歌曲。"
  }
  return null
}

function getLocalMusicDir() {
  if (process.env.BLOG_MUSIC_DIR) {
    return process.env.BLOG_MUSIC_DIR
  }

  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    ...localMusicDirSegments,
  )
}

function getLocalMusicPath(fileName: string) {
  return path.join(getLocalMusicDir(), fileName)
}

function ensureLocalMusicDirForWrite() {
  if (!canWriteLocalMusicLibrary()) {
    throw new Error("当前环境不支持直接写入本地曲库，请改用 Vercel Blob。")
  }

  fs.mkdirSync(getLocalMusicDir(), { recursive: true })
}

function parseTrackName(fileName: string) {
  const baseName = path.basename(fileName, path.extname(fileName))
  const [artistPart, ...titleParts] = baseName.split(" - ")
  const artist = titleParts.length > 0 ? artistPart.trim() : "未知歌手"
  const title = (titleParts.length > 0 ? titleParts.join(" - ") : artistPart).trim()

  return {
    title: title || "未命名歌曲",
    artist: artist || "未知歌手",
  }
}

function toDataUrl(data: Uint8Array, format?: string) {
  if (!data?.length || !format) return ""
  return `data:${format};base64,${Buffer.from(data).toString("base64")}`
}

function normalizeLyrics(rawLyrics: unknown) {
  if (!Array.isArray(rawLyrics)) return ""

  for (const entry of rawLyrics) {
    if (typeof entry === "string" && entry.trim()) {
      return entry.trim()
    }
    if (entry && typeof entry === "object" && "text" in entry) {
      const text = typeof entry.text === "string" ? entry.text.trim() : ""
      if (text) return text
    }
  }

  return ""
}

async function optimizeCoverDataUrl(data?: Uint8Array, format?: string) {
  if (!data?.length || !format) return ""
  if (format === "image/svg+xml" || format === "image/gif") {
    return toDataUrl(data, format)
  }

  try {
    const optimized = await sharp(Buffer.from(data))
      .rotate()
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
    return toDataUrl(optimized, "image/webp")
  } catch {
    return toDataUrl(data, format)
  }
}

async function readTrackMetadataFromBuffer(fileName: string, buffer: Buffer, contentType?: string) {
  const fallback = parseTrackName(fileName)

  try {
    const metadata = contentType
      ? await parseBuffer(buffer, contentType)
      : await parseBuffer(buffer)
    const picture = metadata.common.picture?.[0]
    const lyrics = normalizeLyrics(metadata.common.lyrics)

    return {
      title: metadata.common.title?.trim() || fallback.title,
      artist: metadata.common.artist?.trim() || fallback.artist,
      album: metadata.common.album?.trim() || "",
      coverUrl: picture ? await optimizeCoverDataUrl(picture.data, picture.format) : "",
      lyrics: lyrics.trim(),
    }
  } catch {
    return {
      ...fallback,
      album: "",
      coverUrl: "",
      lyrics: "",
    }
  }
}

function toManagedTrack(input: {
  id: string
  name: string
  pathname: string
  src: string
  storage: "local" | "blob"
  contentType: string
  size: number
  uploadedAt: string
  updatedAt: string
  deletable: boolean
  title: string
  artist: string
  album?: string | null
  coverUrl?: string | null
  lyrics?: string | null
}): ManagedMusicTrack {
  return {
    id: input.id,
    name: input.name,
    pathname: input.pathname,
    src: input.src,
    storage: input.storage,
    contentType: input.contentType,
    size: input.size,
    uploadedAt: input.uploadedAt,
    updatedAt: input.updatedAt,
    deletable: input.deletable,
    title: input.title,
    artist: input.artist,
    album: input.album || "",
    coverUrl: input.coverUrl || "",
    lyrics: input.lyrics || "",
  }
}

async function readLocalTrack(fileName: string): Promise<ManagedMusicTrack> {
  const absolutePath = getLocalMusicPath(fileName)
  const stats = fs.statSync(absolutePath)
  const metadata = await readTrackMetadataFromBuffer(
    fileName,
    fs.readFileSync(absolutePath),
    inferTrackContentType(fileName),
  )

  return toManagedTrack({
    id: fileName,
    name: fileName,
    pathname: fileName,
    src: `/music/${encodeURIComponent(fileName)}`,
    storage: "local",
    contentType: inferTrackContentType(fileName),
    size: stats.size,
    uploadedAt: stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString(),
    deletable: canWriteLocalMusicLibrary(),
    ...metadata,
  })
}

function inferTrackContentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase()
  if (extension === ".mp3") return "audio/mpeg"
  if (extension === ".wav") return "audio/wav"
  if (extension === ".m4a") return "audio/mp4"
  if (extension === ".aac") return "audio/aac"
  if (extension === ".flac") return "audio/flac"
  if (extension === ".ogg") return "audio/ogg"
  return "audio/*"
}

async function listStaticMusicTracks(): Promise<ManagedMusicTrack[]> {
  const musicDir = getLocalMusicDir()

  if (!fs.existsSync(musicDir)) {
    return []
  }

  const fileNames = fs
    .readdirSync(musicDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => supportedExtensions.has(path.extname(fileName).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))

  return Promise.all(fileNames.map(readLocalTrack))
}

function toStoredManagedTrack(record: MusicTrackRecord): ManagedMusicTrack {
  return toManagedTrack({
    id: record.id,
    name: record.name,
    pathname: record.pathname,
    src: record.url,
    storage: record.storage,
    contentType: record.contentType,
    size: record.size,
    uploadedAt: record.uploadedAt,
    updatedAt: record.updatedAt,
    deletable: true,
    title: record.title,
    artist: record.artist,
    album: record.album || "",
    coverUrl: record.coverUrl || "",
    lyrics: record.lyrics || "",
  })
}

export async function listMusicLibraryTracks() {
  const [staticTracks, storedTracks] = await Promise.all([
    listStaticMusicTracks(),
    listMusicTrackRecords(),
  ])

  const trackMap = new Map<string, ManagedMusicTrack>()
  for (const track of staticTracks) {
    trackMap.set(track.src, track)
  }
  for (const record of storedTracks) {
    const track = toStoredManagedTrack(record)
    trackMap.set(track.src, track)
  }

  return [...trackMap.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export async function listPublicMusicTracks(): Promise<MusicTrack[]> {
  const tracks = await listMusicLibraryTracks()
  return [...tracks]
    .sort((a, b) => {
      const artistCompare = a.artist.localeCompare(b.artist, "zh-Hans-CN")
      return artistCompare !== 0 ? artistCompare : a.title.localeCompare(b.title, "zh-Hans-CN")
    })
    .map(({ title, artist, src, album, coverUrl, lyrics }) => ({
      title,
      artist,
      src,
      album,
      coverUrl,
      lyrics,
    }))
}

export async function uploadManagedMusicTrack(file: File) {
  const validation = validateMusicUploadInput(file)
  if (!validation.ok) {
    throw new Error(validation.error)
  }

  const sourceBuffer = Buffer.from(await file.arrayBuffer())
  const metadata = await readTrackMetadataFromBuffer(file.name, sourceBuffer, file.type)
  const extension = getMusicUploadExtension(file.name) || getMusicUploadExtensionByType(file.type) || ".mp3"
  const uploadedAt = new Date().toISOString()

  if (isBlobMusicLibraryEnabled()) {
    const pathname = buildManagedMusicPath(file.name)
    const blob = await put(pathname, sourceBuffer, {
      access: "public",
      contentType: file.type || inferTrackContentType(file.name),
    })

    const record: MusicTrackRecord = {
      id: randomUUID(),
      name: path.basename(blob.pathname),
      pathname: blob.pathname,
      url: blob.url,
      storage: "blob",
      contentType: file.type || inferTrackContentType(file.name),
      size: sourceBuffer.length,
      uploadedAt,
      updatedAt: uploadedAt,
      ...metadata,
    }

    await upsertMusicTrackRecord(record)
    invalidateMusicCache()
    return toStoredManagedTrack(record)
  }

  ensureLocalMusicDirForWrite()
  const fileName = `${sanitizeMusicBaseName(file.name) || "track"}-${randomUUID()}${extension}`
  const absolutePath = getLocalMusicPath(fileName)
  fs.writeFileSync(absolutePath, sourceBuffer)
  const stats = fs.statSync(absolutePath)
  invalidateMusicCache()

  return toManagedTrack({
    id: fileName,
    name: fileName,
    pathname: fileName,
    src: `/music/${encodeURIComponent(fileName)}`,
    storage: "local",
    contentType: file.type || inferTrackContentType(fileName),
    size: stats.size,
    uploadedAt: stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString(),
    deletable: true,
    ...metadata,
  })
}

export async function finalizeUploadedBlobMusicTrack(input: {
  pathname: string
  url: string
  contentType?: string
  size?: number
  originalName?: string
}) {
  if (!isBlobMusicLibraryEnabled()) {
    throw new Error("当前环境未启用 Vercel Blob 曲库上传")
  }

  if (!input.pathname.startsWith("music-library/")) {
    throw new Error("无效的音乐上传路径")
  }

  const existing = await getMusicTrackRecordByPathname(input.pathname)
  if (existing) {
    return toStoredManagedTrack(existing)
  }

  const response = await fetch(input.url)
  if (!response.ok) {
    throw new Error("无法读取已上传的音频文件")
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const metadata = await readTrackMetadataFromBuffer(
    input.originalName || input.pathname,
    buffer,
    input.contentType || inferTrackContentType(input.pathname),
  )
  const uploadedAt = new Date().toISOString()
  const record: MusicTrackRecord = {
    id: randomUUID(),
    name: path.basename(input.pathname),
    pathname: input.pathname,
    url: input.url,
    storage: "blob",
    contentType: input.contentType || inferTrackContentType(input.pathname),
    size: input.size || buffer.length,
    uploadedAt,
    updatedAt: uploadedAt,
    ...metadata,
  }

  await upsertMusicTrackRecord(record)
  invalidateMusicCache()
  return toStoredManagedTrack(record)
}

export async function deleteManagedMusicTrack(trackId: string) {
  const storedTrack = await getMusicTrackRecordById(trackId)

  if (storedTrack) {
    if (storedTrack.storage === "blob") {
      await del(storedTrack.pathname)
    } else if (canWriteLocalMusicLibrary()) {
      fs.rmSync(getLocalMusicPath(storedTrack.pathname), { force: true })
    }
    await deleteMusicTrackRecord(trackId)
    invalidateMusicCache()
    return true
  }

  if (!canWriteLocalMusicLibrary()) {
    return false
  }

  const fileName = decodeURIComponent(trackId)
  if (!supportedExtensions.has(path.extname(fileName).toLowerCase())) {
    return false
  }

  const absolutePath = getLocalMusicPath(fileName)
  if (!fs.existsSync(absolutePath)) {
    return false
  }

  fs.rmSync(absolutePath, { force: true })
  invalidateMusicCache()
  return true
}
