import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export interface MusicTrack {
  title: string
  artist: string
  src: string
}

const musicDir = path.join(process.cwd(), 'public/music')
const supportedExtensions = new Set(['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'])

function parseTrack(fileName: string): MusicTrack {
  const baseName = path.basename(fileName, path.extname(fileName))
  const [artistPart, ...titleParts] = baseName.split(' - ')
  const artist = titleParts.length > 0 ? artistPart.trim() : '未知歌手'
  const title = (titleParts.length > 0 ? titleParts.join(' - ') : artistPart).trim()

  return {
    title: title || '未命名歌曲',
    artist: artist || '未知歌手',
    src: `/music/${encodeURIComponent(fileName)}`,
  }
}

function readPlaylist(): MusicTrack[] {
  try {
    const files = fs.readdirSync(musicDir, { withFileTypes: true })
    return files
      .filter(file => file.isFile())
      .map(file => file.name)
      .filter(fileName => supportedExtensions.has(path.extname(fileName).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
      .map(parseTrack)
  } catch {
    return []
  }
}

export async function GET() {
  return NextResponse.json({ tracks: readPlaylist() })
}
