import fs from 'fs'
import path from 'path'
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { parseFile } from 'music-metadata'
import { CACHE_TAGS } from '@/lib/server/site-cache'

export interface MusicTrack {
  title: string
  artist: string
  src: string
  album?: string
  coverUrl?: string
  lyrics?: string
}

const musicDir = path.join(process.cwd(), 'public/music')
const supportedExtensions = new Set(['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'])

function parseTrackName(fileName: string) {
  const baseName = path.basename(fileName, path.extname(fileName))
  const [artistPart, ...titleParts] = baseName.split(' - ')
  const artist = titleParts.length > 0 ? artistPart.trim() : '未知歌手'
  const title = (titleParts.length > 0 ? titleParts.join(' - ') : artistPart).trim()

  return {
    title: title || '未命名歌曲',
    artist: artist || '未知歌手',
  }
}

function toDataUrl(data: Uint8Array, format?: string) {
  if (!data?.length || !format) return ''
  return `data:${format};base64,${Buffer.from(data).toString('base64')}`
}

function normalizeLyrics(rawLyrics: unknown) {
  if (!Array.isArray(rawLyrics)) return ''

  for (const entry of rawLyrics) {
    if (typeof entry === 'string' && entry.trim()) {
      return entry.trim()
    }
    if (entry && typeof entry === 'object' && 'text' in entry) {
      const text = typeof entry.text === 'string' ? entry.text.trim() : ''
      if (text) return text
    }
  }

  return ''
}

async function readTrack(fileName: string): Promise<MusicTrack> {
  const fallback = parseTrackName(fileName)
  const absolutePath = path.join(musicDir, fileName)

  try {
    const metadata = await parseFile(absolutePath, { skipPostHeaders: true })
    const picture = metadata.common.picture?.[0]
    const lyrics = normalizeLyrics(metadata.common.lyrics)

    return {
      title: metadata.common.title?.trim() || fallback.title,
      artist: metadata.common.artist?.trim() || fallback.artist,
      album: metadata.common.album?.trim() || '',
      src: `/music/${encodeURIComponent(fileName)}`,
      coverUrl: picture ? toDataUrl(picture.data, picture.format) : '',
      lyrics: lyrics.trim(),
    }
  } catch {
    return {
      ...fallback,
      src: `/music/${encodeURIComponent(fileName)}`,
      album: '',
      coverUrl: '',
      lyrics: '',
    }
  }
}

async function readPlaylist() {
  try {
    const files = fs.readdirSync(musicDir, { withFileTypes: true })
    const musicFiles = files
      .filter((file) => file.isFile())
      .map((file) => file.name)
      .filter((fileName) => supportedExtensions.has(path.extname(fileName).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))

    return Promise.all(musicFiles.map(readTrack))
  } catch {
    return []
  }
}

const getCachedPlaylist = unstable_cache(readPlaylist, ['music-playlist'], {
  tags: [CACHE_TAGS.music],
  revalidate: 3600,
})

export async function GET() {
  return NextResponse.json(
    { tracks: await getCachedPlaylist() },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
