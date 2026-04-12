"use client"
/* eslint-disable @next/next/no-img-element */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { MusicTrack } from "@/app/api/music/route"

type PlayMode = "loop" | "repeat-one" | "shuffle"

const favoriteStorageKey = "champion-blog:favorite-tracks"
const recentStorageKey = "champion-blog:recent-tracks"

const fallbackPlaylist: MusicTrack[] = [
  { title: "最美的太阳", artist: "张杰", src: "/music/张杰 - 最美的太阳.mp3" },
  { title: "着魔", artist: "张杰", src: "/music/张杰 - 着魔.mp3" },
  { title: "这里是神奇的赛尔号", artist: "张杰", src: "/music/张杰 - 这里是神奇的赛尔号（《赛尔号》动画插曲）.mp3" },
  { title: "这，就是爱", artist: "张杰", src: "/music/张杰 - 这，就是爱.mp3" },
]

function MarqueeText({ text, isActive, charCount = 6 }: { text: string; isActive: boolean; charCount?: number }) {
  return (
    <span className="block max-w-full overflow-hidden leading-tight">
      {text.length <= charCount || !isActive ? (
        <span className="block truncate">{text}</span>
      ) : (
        <span className="inline-block animate-marquee" style={{ whiteSpace: "nowrap" }}>
          {text}
        </span>
      )}
    </span>
  )
}

function SyncedLyricsPanel({ lyrics, activeIndex }: { lyrics: Array<{ time: number; text: string }>; activeIndex: number }) {
  if (lyrics.length === 0) {
    return <p className="text-xs text-muted-foreground leading-5">当前歌曲没有可滚动的时间轴歌词。</p>
  }

  const safeIndex = activeIndex >= 0 ? activeIndex : 0
  const lineHeight = 28
  const viewportHeight = lineHeight * 5
  const paddingOffset = lineHeight * 2

  return (
    <div className="overflow-hidden px-1 text-center" style={{ height: viewportHeight }}>
      <div
        className="transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translateY(${paddingOffset - safeIndex * lineHeight}px)` }}
      >
      {lyrics.map((line, index) => (
        <p
          key={`${line.time}-${index}`}
          className={`truncate whitespace-nowrap px-2 py-1 text-xs leading-5 transition-all duration-300 ${
            index === activeIndex
              ? "text-primary font-bold text-sm scale-[1.14] opacity-100 tracking-[0.01em]"
              : index < activeIndex
                ? "text-foreground/65 scale-100 opacity-35"
                : "text-muted-foreground scale-100 opacity-50"
          }`}
          style={{ height: lineHeight, lineHeight: `${lineHeight}px`, transformOrigin: "center center" }}
        >
          {line.text}
        </p>
      ))}
      </div>
    </div>
  )
}

function readStoredList(key: string) {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeStoredList(key: string, value: string[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function parseTimedLyrics(rawLyrics?: string) {
  if (!rawLyrics?.trim()) return []

  return rawLyrics
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\](.*)$/)
      if (!match) return null

      const minutes = Number(match[1] || 0)
      const seconds = Number(match[2] || 0)
      const fraction = match[3] || "0"
      const milliseconds = Number(fraction.padEnd(3, "0"))
      const text = match[4]?.trim()

      if (!text) return null

      return {
        time: minutes * 60 + seconds + milliseconds / 1000,
        text,
      }
    })
    .filter(Boolean) as Array<{ time: number; text: string }>
}

interface MusicContextValue {
  playlist: MusicTrack[]
  isPlaying: boolean
  isHovering: boolean
  currentTrack: number
  track: MusicTrack
  playMode: PlayMode
  recentTracks: MusicTrack[]
  favoriteTracks: MusicTrack[]
  currentLyrics: string[]
  parsedLyrics: Array<{ time: number; text: string }>
  activeLyricIndex: number
  currentTime: number
  togglePlay: () => void
  cyclePlayMode: () => void
  playPrevious: () => void
  playNext: () => void
  selectTrack: (index: number, openPanel?: boolean) => void
  playTrackBySrc: (src?: string | null, openPanel?: boolean) => void
  toggleFavorite: (src: string) => void
  isFavorite: (src: string) => boolean
  progress: number
  duration: number
  dragProgress: number | null
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  handleProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void
  formatTime: (seconds: number) => string
}

const MusicContext = createContext<MusicContextValue>({
  playlist: fallbackPlaylist,
  isPlaying: false,
  isHovering: false,
  currentTrack: 0,
  track: fallbackPlaylist[0],
  playMode: "loop",
  recentTracks: [],
  favoriteTracks: [],
  currentLyrics: [],
  parsedLyrics: [],
  activeLyricIndex: -1,
  currentTime: 0,
  togglePlay: () => {},
  cyclePlayMode: () => {},
  playPrevious: () => {},
  playNext: () => {},
  selectTrack: () => {},
  playTrackBySrc: () => {},
  toggleFavorite: () => {},
  isFavorite: () => false,
  progress: 0,
  duration: 0,
  dragProgress: null,
  handleMouseDown: () => {},
  handleProgressClick: () => {},
  formatTime: () => "0:00",
})

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<MusicTrack[]>(fallbackPlaylist)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [showList, setShowList] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [dragProgress, setDragProgress] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [playMode, setPlayMode] = useState<PlayMode>("loop")
  const [favoriteSrcs, setFavoriteSrcs] = useState<string[]>(() => readStoredList(favoriteStorageKey))
  const [recentSrcs, setRecentSrcs] = useState<string[]>(() => readStoredList(recentStorageKey))
  const leaveTimerRef = useRef<number | null>(null)
  const keepOpenUntilRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const progressBarRectRef = useRef<DOMRect | null>(null)

  const activeTrackIndex = currentTrack < playlist.length ? currentTrack : 0
  const track = playlist[activeTrackIndex] ?? fallbackPlaylist[0]
  const currentLyrics = useMemo(() => (track?.lyrics || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean), [track?.lyrics])
  const parsedLyrics = useMemo(() => parseTimedLyrics(track?.lyrics), [track?.lyrics])
  const activeLyricIndex = useMemo(() => {
    if (!parsedLyrics.length) return -1
    for (let index = parsedLyrics.length - 1; index >= 0; index -= 1) {
      if (currentTime >= parsedLyrics[index].time) {
        return index
      }
    }
    return -1
  }, [currentTime, parsedLyrics])
  const favoriteTracks = useMemo(() => playlist.filter((item) => favoriteSrcs.includes(item.src)), [favoriteSrcs, playlist])
  const recentTracks = useMemo(() => recentSrcs.map((src) => playlist.find((item) => item.src === src)).filter(Boolean) as MusicTrack[], [playlist, recentSrcs])

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  const startLeaveTimer = useCallback((long = false) => {
    clearLeaveTimer()
    keepOpenUntilRef.current = long ? Date.now() + 10000 : 0
    leaveTimerRef.current = window.setTimeout(() => {
      if (long && Date.now() <= keepOpenUntilRef.current) return
      keepOpenUntilRef.current = 0
      setIsHovering(false)
    }, long ? 10000 : 400)
  }, [clearLeaveTimer])

  const formatTime = useCallback((seconds: number) => {
    if (!seconds || Number.isNaN(seconds)) return "0:00"
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`
  }, [])

  const isFavorite = useCallback((src: string) => favoriteSrcs.includes(src), [favoriteSrcs])

  const toggleFavorite = useCallback((src: string) => {
    setFavoriteSrcs((current) => {
      const next = current.includes(src) ? current.filter((item) => item !== src) : [src, ...current]
      writeStoredList(favoriteStorageKey, next)
      return next
    })
  }, [])

  const rememberTrack = useCallback((src: string) => {
    setRecentSrcs((current) => {
      const next = [src, ...current.filter((item) => item !== src)].slice(0, 8)
      writeStoredList(recentStorageKey, next)
      return next
    })
  }, [])

  const cyclePlayMode = useCallback(() => {
    setPlayMode((current) => (current === "loop" ? "repeat-one" : current === "repeat-one" ? "shuffle" : "loop"))
  }, [])

  const selectTrack = useCallback((index: number, openPanel = true) => {
    const nextTrack = playlist[index]
    if (!audioRef.current || !nextTrack) return

    audioRef.current.src = nextTrack.src
    audioRef.current.load()
    setCurrentTrack(index)
    setShowList(false)
    setProgress(0)
    setDuration(0)
    setCurrentTime(0)
    setDragProgress(null)
    isDraggingRef.current = false
    didDragRef.current = false
    rememberTrack(nextTrack.src)
    window.setTimeout(() => {
      audioRef.current?.play().catch(() => {})
    }, 80)

    if (openPanel) {
      setIsHovering(true)
      startLeaveTimer(true)
    }
  }, [playlist, rememberTrack, startLeaveTimer])

  const playTrackBySrc = useCallback((src?: string | null, openPanel = true) => {
    if (!src) return
    const index = playlist.findIndex((item) => item.src === src)
    if (index >= 0) {
      selectTrack(index, openPanel)
    }
  }, [playlist, selectTrack])

  const playPrevious = useCallback(() => {
    if (!playlist.length) return
    const previousIndex = activeTrackIndex === 0 ? playlist.length - 1 : activeTrackIndex - 1
    selectTrack(previousIndex)
  }, [activeTrackIndex, playlist.length, selectTrack])

  const playNext = useCallback(() => {
    if (!playlist.length) return
    if (playMode === "repeat-one") {
      selectTrack(activeTrackIndex)
      return
    }
    if (playMode === "shuffle" && playlist.length > 1) {
      let nextIndex = activeTrackIndex
      while (nextIndex === activeTrackIndex) {
        nextIndex = Math.floor(Math.random() * playlist.length)
      }
      selectTrack(nextIndex)
      return
    }
    selectTrack((activeTrackIndex + 1) % playlist.length)
  }, [activeTrackIndex, playMode, playlist.length, selectTrack])

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !track) return
    if (isPlaying) {
      audioRef.current.pause()
      return
    }
    rememberTrack(track.src)
    audioRef.current.play().catch(() => {})
  }, [isPlaying, rememberTrack, track])

  const handleWindowMouseMove = useCallback((event: MouseEvent) => {
    if (!isDraggingRef.current || !progressBarRectRef.current) return
    didDragRef.current = true
    const pct = Math.max(0, Math.min(1, (event.clientX - progressBarRectRef.current.left) / progressBarRectRef.current.width))
    setDragProgress(pct * 100)
  }, [])

  const handleWindowMouseUp = useCallback((event: MouseEvent) => {
    if (isDraggingRef.current && progressBarRectRef.current && audioRef.current) {
      const pct = Math.max(0, Math.min(1, (event.clientX - progressBarRectRef.current.left) / progressBarRectRef.current.width))
      if (audioRef.current.duration) {
        audioRef.current.currentTime = pct * audioRef.current.duration
        setProgress(pct * 100)
      }
      setDragProgress(null)
    }
    isDraggingRef.current = false
    window.removeEventListener("mousemove", handleWindowMouseMove)
  }, [handleWindowMouseMove])

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    progressBarRectRef.current = event.currentTarget.getBoundingClientRect()
    isDraggingRef.current = true
    didDragRef.current = false
    window.addEventListener("mousemove", handleWindowMouseMove)
    window.addEventListener("mouseup", handleWindowMouseUp)
  }, [handleWindowMouseMove, handleWindowMouseUp])

  const handleProgressClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    event.stopPropagation()
    if (!audioRef.current?.duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * audioRef.current.duration
    setProgress(pct * 100)
    setDragProgress(null)
  }, [])

  useEffect(() => {
    fetch("/api/music", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data.tracks) || data.tracks.length === 0) return
        setPlaylist(data.tracks as MusicTrack[])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove)
      window.removeEventListener("mouseup", handleWindowMouseUp)
    }
  }, [handleWindowMouseMove, handleWindowMouseUp])

  const playModeLabel = playMode === "loop" ? "列表循环" : playMode === "repeat-one" ? "单曲循环" : "随机播放"
  const playModeIcon = playMode === "loop" ? "🔁" : playMode === "repeat-one" ? "🔂" : "🔀"

  return (
    <MusicContext.Provider
      value={{
        playlist,
        isPlaying,
        isHovering,
        currentTrack,
        track,
        playMode,
        recentTracks,
        favoriteTracks,
        currentLyrics,
        parsedLyrics,
        activeLyricIndex,
        currentTime,
        togglePlay,
        cyclePlayMode,
        playPrevious,
        playNext,
        selectTrack,
        playTrackBySrc,
        toggleFavorite,
        isFavorite,
        progress,
        duration,
        dragProgress,
        handleMouseDown,
        handleProgressClick,
        formatTime,
      }}
    >
      <audio
        ref={audioRef}
        src={track?.src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (!audioRef.current || isDraggingRef.current) return
          setCurrentTime(audioRef.current.currentTime || 0)
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0)
          setDuration(audioRef.current.duration || 0)
        }}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration || 0)
          setCurrentTime(audioRef.current?.currentTime || 0)
        }}
        onEnded={playNext}
      />

      <div
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => {
          clearLeaveTimer()
          setIsHovering(true)
        }}
        onMouseLeave={() => {
          if (Date.now() > keepOpenUntilRef.current) startLeaveTimer()
        }}
      >
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#6C3FF5] to-[#FF9B6B] shadow-lg flex items-center justify-center cursor-pointer overflow-hidden ${isPlaying ? "animate-spin" : ""}`}
          style={{ animationDuration: isPlaying ? "3s" : "0s", opacity: !isHovering ? 1 : 0, transition: "opacity 0.5s" }}
        >
          {track.coverUrl ? (
            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">🎵</span>
          )}
        </div>

        <div
          className={`absolute bottom-0 right-0 transition-all duration-500 origin-bottom-right ${
            isHovering ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
          style={{ width: "18rem" }}
        >
          <div className="bg-card rounded-2xl border border-border/60 shadow-xl overflow-hidden">
            {showList ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">播放列表</span>
                  <button onClick={() => setShowList(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {playlist.map((song, index) => (
                    <div
                      key={song.src}
                      onClick={() => {
                        setShowList(false)
                        selectTrack(index, false)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setShowList(false)
                          selectTrack(index, false)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`w-full cursor-pointer text-left rounded-xl p-2 transition-colors ${currentTrack === index ? "bg-primary/10 text-primary" : "hover:bg-accent/50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary/40 flex items-center justify-center">
                          {song.coverUrl ? <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" /> : <span>🎵</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{song.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleFavorite(song.src)
                          }}
                          className="text-sm"
                          title={isFavorite(song.src) ? "取消收藏" : "收藏"}
                        >
                          {isFavorite(song.src) ? "❤️" : "🤍"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-[#6C3FF5] to-[#FF9B6B] flex items-center justify-center flex-shrink-0">
                    {track.coverUrl ? <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" /> : <span className="text-xl">🎵</span>}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-sm font-medium">
                      <MarqueeText key={track.title} text={track.title} isActive={isPlaying} charCount={8} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <MarqueeText key={`${track.artist}-${track.title}`} text={track.artist} isActive={isPlaying} charCount={8} />
                    </p>
                    {track.album && <p className="text-[11px] text-muted-foreground truncate mt-1">{track.album}</p>}
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleFavorite(track.src)
                    }}
                    className="text-lg"
                    title={isFavorite(track.src) ? "取消收藏" : "收藏"}
                  >
                    {isFavorite(track.src) ? "❤️" : "🤍"}
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      togglePlay()
                    }}
                    className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0"
                  >
                    {isPlaying ? <span className="text-sm">⏸</span> : <span className="text-sm ml-0.5">▶</span>}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <button onClick={(event) => { event.stopPropagation(); playPrevious() }} className="hover:text-foreground transition-colors">⏮</button>
                    <button onClick={(event) => { event.stopPropagation(); cyclePlayMode() }} className="hover:text-foreground transition-colors" title={playModeLabel}>
                      {playModeIcon} {playModeLabel}
                    </button>
                    <button onClick={(event) => { event.stopPropagation(); playNext() }} className="hover:text-foreground transition-colors">⏭</button>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full relative cursor-pointer" onMouseDown={handleMouseDown} onClick={handleProgressClick}>
                    <div className="absolute top-0 left-0 h-full bg-primary rounded-full" style={{ width: `${dragProgress ?? progress}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-md pointer-events-none" style={{ left: `calc(${dragProgress ?? progress}% - 7px)` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(((dragProgress ?? progress) / 100) * duration)}</span>
                    <button onClick={(event) => { event.stopPropagation(); setShowList(true) }} className="hover:text-foreground transition-colors">
                      播放列表 ›
                    </button>
                  </div>
                </div>

                {(favoriteTracks.length > 0 || recentTracks.length > 0) && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-secondary/30 p-3">
                      <p className="font-medium mb-2">收藏</p>
                      <div className="space-y-1">
                        {favoriteTracks.slice(0, 2).map((item) => (
                          <button key={item.src} onClick={() => playTrackBySrc(item.src, false)} className="block truncate text-left hover:text-primary transition-colors">
                            {item.title}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-secondary/30 p-3">
                      <p className="font-medium mb-2">最近播放</p>
                      <div className="space-y-1">
                        {recentTracks.slice(0, 2).map((item) => (
                          <button key={item.src} onClick={() => playTrackBySrc(item.src, false)} className="block truncate text-left hover:text-primary transition-colors">
                            {item.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentLyrics.length > 0 && (
                  <div className="rounded-xl bg-secondary/20 p-3">
                    <p className="text-xs font-medium mb-2">歌词</p>
                    <SyncedLyricsPanel lyrics={parsedLyrics} activeIndex={activeLyricIndex} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      ` }} />

      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  return useContext(MusicContext)
}
