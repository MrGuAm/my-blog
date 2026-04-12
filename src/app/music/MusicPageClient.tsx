"use client"
/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useMusic } from "@/context/MusicContext"

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
    selectTrack,
    toggleFavorite,
    isFavorite,
    seekToTime,
    formatTime,
  } = useMusic()

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#6C3FF5]/60">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-lg font-black">音乐角落</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/home" className="text-sm text-muted-foreground transition-colors hover:text-primary">Home</Link>
            <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-primary">About</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-border/50 bg-card p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="h-40 w-40 overflow-hidden rounded-3xl bg-gradient-to-br from-[#6C3FF5] to-[#FF9B6B]">
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt={track.title} className={`h-full w-full object-cover ${isPlaying ? "animate-pulse" : ""}`} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">🎵</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Now Playing</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">{track.title}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{track.artist}</p>
                {track.album && <p className="mt-1 text-sm text-muted-foreground">专辑：{track.album}</p>}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={playPrevious} className="rounded-full border border-border/50 px-4 py-2 text-sm hover:bg-accent">上一首</button>
                  <button type="button" onClick={togglePlay} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                    {isPlaying ? "暂停" : "播放"}
                  </button>
                  <button type="button" onClick={() => playNext()} className="rounded-full border border-border/50 px-4 py-2 text-sm hover:bg-accent">下一首</button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(track.src)}
                    className="rounded-full border border-border/50 px-4 py-2 text-sm hover:bg-accent"
                  >
                    {isFavorite(track.src) ? "已收藏" : "收藏这首"}
                  </button>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">当前时间：{formatTime(currentTime)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">同步歌词</h2>
            {parsedLyrics.length > 0 ? (
              <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-2 text-center">
                {parsedLyrics.map((line, index) => (
                  <button
                    key={`${line.time}-${index}`}
                    type="button"
                    onClick={() => seekToTime(line.time)}
                    className={`block w-full rounded-2xl px-3 py-2 text-center text-sm transition-all ${
                      index === activeLyricIndex
                        ? "scale-[1.03] bg-primary/10 font-bold text-primary"
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                    }`}
                  >
                    {line.text}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">当前歌曲没有可点击的时间轴歌词。</p>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/50 bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">收藏歌曲</h2>
                <span className="text-xs text-muted-foreground">{favoriteTracks.length} 首</span>
              </div>
              <div className="space-y-2">
                {favoriteTracks.length > 0 ? favoriteTracks.map((song) => (
                  <button
                    key={song.src}
                    type="button"
                    onClick={() => selectTrack(playlist.findIndex((item) => item.src === song.src))}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-accent/30"
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-xl bg-secondary/40">
                      {song.coverUrl ? <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center">🎵</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{song.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                    </div>
                  </button>
                )) : <p className="text-sm text-muted-foreground">还没有收藏歌曲。</p>}
              </div>
            </div>

            <div className="rounded-3xl border border-border/50 bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">最近播放</h2>
                <span className="text-xs text-muted-foreground">{recentTracks.length} 首</span>
              </div>
              <div className="space-y-2">
                {recentTracks.length > 0 ? recentTracks.map((song) => (
                  <button
                    key={song.src}
                    type="button"
                    onClick={() => selectTrack(playlist.findIndex((item) => item.src === song.src))}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-accent/30"
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-xl bg-secondary/40">
                      {song.coverUrl ? <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center">🎵</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{song.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                    </div>
                  </button>
                )) : <p className="text-sm text-muted-foreground">最近还没有播放记录。</p>}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">完整歌单</h2>
              <span className="text-xs text-muted-foreground">{playlist.length} 首</span>
            </div>
            <div className="space-y-2">
              {playlist.map((song, index) => (
                <div
                  key={song.src}
                  onClick={() => selectTrack(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      selectTrack(index)
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
