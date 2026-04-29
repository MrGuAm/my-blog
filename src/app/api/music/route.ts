import { unstable_cache } from "next/cache"
import { NextResponse } from "next/server"
import { listPublicMusicTracks, type MusicTrack } from "@/lib/server/music"
import { CACHE_TAGS } from "@/lib/server/site-cache"

export type { MusicTrack } from "@/lib/server/music"

const getCachedPlaylist = unstable_cache(listPublicMusicTracks, ["music-playlist"], {
  tags: [CACHE_TAGS.music],
  revalidate: 3600,
})

async function resolvePlaylist() {
  try {
    return await getCachedPlaylist()
  } catch (error) {
    if (error instanceof Error && error.message.includes("incrementalCache missing")) {
      return listPublicMusicTracks()
    }
    throw error
  }
}

export async function GET() {
  return NextResponse.json(
    { tracks: await resolvePlaylist() satisfies MusicTrack[] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  )
}
