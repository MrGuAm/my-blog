"use client"
/* eslint-disable @next/next/no-img-element */

import PrimaryNavLinks from "@/components/PrimaryNavLinks"
import SyncedLyricsPanel from "@/components/music/SyncedLyricsPanel"
import { useMusic } from "@/context/MusicContext"

type TrackSummary = {
  src: string
  title: string
  artist: string
  coverUrl?: string
}

function TrackArtwork({
  title,
  coverUrl,
  className,
  pulse = false,
}: {
  title: string
  coverUrl?: string
  className: string
  pulse?: boolean
}) {
  return (
    <div className={`overflow-hidden rounded-3xl bg-gradient-to-br from-[#7b9bff] to-[#f697c2] ${className}`}>
      {coverUrl ? (
        <img src={coverUrl} alt={title} className={`h-full w-full object-cover ${pulse ? "animate-pulse" : ""}`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-5xl">🎵</div>
      )}
    </div>
  )
}

function TrackListButton({
  song,
  onSelect,
}: {
  song: TrackSummary
  onSelect: (src: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(song.src)}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-accent/30"
    >
      <div className="h-10 w-10 overflow-hidden rounded-xl bg-secondary/40">
        {song.coverUrl ? (
          <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">🎵</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{song.title}</p>
        <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
      </div>
    </button>
  )
}

function TrackSection({
  title,
  count,
  emptyText,
  tracks,
  onSelect,
}: {
  title: string
  count: number
  emptyText: string
  tracks: TrackSummary[]
  onSelect: (src: string) => void
}) {
  return (
    <div className="editorial-card-soft">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-xs text-muted-foreground">{count} 首</span>
      </div>
      <div className="space-y-2">
        {tracks.length > 0 ? (
          tracks.map((song) => (
            <TrackListButton key={song.src} song={song} onSelect={onSelect} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )}
      </div>
    </div>
  )
}

export default function MusicPageClient() {
  const {
    playlist,
    track,
    currentTrack,
    isPlaying,
    currentTime,
    parsedLyrics,
    activeLyricIndex,
    favoriteTracks,
    recentTracks,
    togglePlay,
    playPrevious,
    playNext,
    playTrackBySrc,
    selectTrack,
    toggleFavorite,
    isFavorite,
    seekToTime,
    formatTime,
  } = useMusic()

  return (
    <div className="min-h-screen text-foreground">
      <nav className="apple-nav sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="brand-mark">
                <span className="text-sm font-bold text-white">C</span>
              </div>
              <span className="text-lg font-semibold tracking-[-0.03em]">音乐角落</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <PrimaryNavLinks active="music" />
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] sm:gap-6">
          <div className="editorial-card !p-5 sm:!p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <TrackArtwork
                title={track.title}
                coverUrl={track.coverUrl}
                pulse={isPlaying}
                className="h-28 w-28 sm:h-40 sm:w-40"
              />
              <div className="min-w-0 flex-1">
                <p className="section-kicker">Now Playing</p>
                <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.06em] sm:text-[2.2rem]">{track.title}</h1>
                <p className="mt-2 text-base text-muted-foreground sm:text-lg">{track.artist}</p>
                {track.album ? <p className="mt-1 text-sm text-muted-foreground">专辑：{track.album}</p> : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={playPrevious} className="apple-button-secondary">上一首</button>
                  <button type="button" onClick={togglePlay} className="brand-solid-button px-5 py-2">
                    {isPlaying ? "暂停" : "播放"}
                  </button>
                  <button type="button" onClick={() => playNext()} className="apple-button-secondary">下一首</button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(track.src)}
                    className="apple-button-secondary"
                  >
                    {isFavorite(track.src) ? "已收藏" : "收藏这首"}
                  </button>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">当前时间：{formatTime(currentTime)}</p>
              </div>
            </div>
          </div>

          <div className="editorial-card-soft !p-5 sm:!p-6">
            <h2 className="mb-4 text-lg font-bold">同步歌词</h2>
            <SyncedLyricsPanel
              lyrics={parsedLyrics}
              activeIndex={activeLyricIndex}
              onSeek={seekToTime}
              height={320}
              variant="page"
              emptyText="当前歌曲没有可点击的时间轴歌词。"
            />
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <TrackSection
              title="收藏歌曲"
              count={favoriteTracks.length}
              emptyText="还没有收藏歌曲。"
              tracks={favoriteTracks}
              onSelect={(src) => playTrackBySrc(src, false)}
            />

            <TrackSection
              title="最近播放"
              count={recentTracks.length}
              emptyText="最近还没有播放记录。"
              tracks={recentTracks}
              onSelect={(src) => playTrackBySrc(src, false)}
            />
          </div>

          <div className="editorial-card-soft">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">完整歌单</h2>
              <span className="text-xs text-muted-foreground">{playlist.length} 首</span>
            </div>
            <div className="space-y-2">
              {playlist.map((song, index) => (
                <div
                  key={song.src}
                  onClick={() => selectTrack(index, false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      selectTrack(index, false)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors ${
                    index === currentTrack ? "bg-primary/10 text-primary" : "hover:bg-accent/30"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/40 text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{song.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleFavorite(song.src)
                    }}
                    className="text-lg"
                  >
                    {isFavorite(song.src) ? "❤️" : "🤍"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
