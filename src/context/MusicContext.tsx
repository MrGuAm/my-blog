"use client"

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react"

export const musicPlaylist = [
  { title: "最美的太阳", artist: "张杰", src: "/music/张杰 - 最美的太阳.mp3" },
  { title: "着魔", artist: "张杰", src: "/music/张杰 - 着魔.mp3" },
  { title: "这里是神奇的赛尔号", artist: "张杰", src: "/music/张杰 - 这里是神奇的赛尔号（《赛尔号》动画插曲）.mp3" },
  { title: "这，就是爱", artist: "张杰", src: "/music/张杰 - 这，就是爱.mp3" },
]

function MarqueeText({ text, isActive, charCount = 6 }: { text: string; isActive: boolean; charCount?: number }) {
  if (text.length <= charCount) {
    return <span className="truncate">{text}</span>
  }

  return (
    <span className="inline-block overflow-hidden">
      <span
        className={`inline-block ${isActive ? "animate-marquee" : ""}`}
        style={{ whiteSpace: "nowrap" }}
      >
        {text}
      </span>
    </span>
  )
}

interface MusicContextValue {
  isPlaying: boolean
  isHovering: boolean
  currentTrack: number
  track: typeof musicPlaylist[number]
  togglePlay: () => void
  selectTrack: (index: number, openPanel?: boolean) => void
  progress: number
  duration: number
  dragProgress: number | null
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  handleProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void
  formatTime: (seconds: number) => string
}

const MusicContext = createContext<MusicContextValue>({
  isPlaying: false,
  isHovering: false,
  currentTrack: 0,
  track: musicPlaylist[0],
  togglePlay: () => {},
  selectTrack: () => {},
  progress: 0,
  duration: 0,
  dragProgress: null,
  handleMouseDown: () => {},
  handleProgressClick: () => {},
  formatTime: () => "0:00",
})

export function MusicProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [showList, setShowList] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dragProgress, setDragProgress] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keepOpenUntilRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const progressBarRectRef = useRef<DOMRect | null>(null)


  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  const startLeaveTimer = useCallback((long = false) => {
    if (long) {
      keepOpenUntilRef.current = Date.now() + 10000
      clearLeaveTimer()
    } else {
      keepOpenUntilRef.current = 0
      clearLeaveTimer()
      leaveTimerRef.current = setTimeout(() => {
        keepOpenUntilRef.current = 0
        setIsHovering(false)
      }, 400)
    }
  }, [clearLeaveTimer])

  const track = musicPlaylist[currentTrack]

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleWindowMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !progressBarRectRef.current) return
    didDragRef.current = true
    const pct = Math.max(0, Math.min(1, (e.clientX - progressBarRectRef.current.left) / progressBarRectRef.current.width))
    setDragProgress(pct * 100)
  }, [])

  const handleWindowMouseUp = useCallback(function onWindowMouseUp(e: MouseEvent) {
    if (isDraggingRef.current && progressBarRectRef.current && audioRef.current) {
      const pct = Math.max(0, Math.min(1, (e.clientX - progressBarRectRef.current.left) / progressBarRectRef.current.width))
      if (audioRef.current.duration) {
        audioRef.current.currentTime = pct * audioRef.current.duration
        setProgress(pct * 100)
      }
      setDragProgress(null)
    }
    isDraggingRef.current = false
    window.removeEventListener("mousemove", handleWindowMouseMove)
    window.removeEventListener("mouseup", onWindowMouseUp)
  }, [handleWindowMouseMove])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    progressBarRectRef.current = rect
    isDraggingRef.current = true
    didDragRef.current = false
    window.addEventListener("mousemove", handleWindowMouseMove)
    window.addEventListener("mouseup", handleWindowMouseUp)
  }, [handleWindowMouseMove, handleWindowMouseUp])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (didDragRef.current) { didDragRef.current = false; return }
    e.stopPropagation()
    if (!audioRef.current?.duration) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * audioRef.current.duration
    setProgress(pct * 100)
    setDragProgress(null)
  }, [])

  const selectTrack = useCallback((index: number, openPanel = true) => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.src = musicPlaylist[index].src
    audioRef.current.load()
    setCurrentTrack(index)
    setShowList(false)
    setProgress(0)
    setIsPlaying(true)
    setDragProgress(null)
    isDraggingRef.current = false
    didDragRef.current = false
    window.removeEventListener("mousemove", handleWindowMouseMove)
    window.removeEventListener("mouseup", handleWindowMouseUp)
    setTimeout(() => audioRef.current?.play(), 100)
    if (openPanel) {
      startLeaveTimer(true)
      setIsHovering(true)
    }
  }, [handleWindowMouseMove, handleWindowMouseUp, startLeaveTimer])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove)
      window.removeEventListener("mouseup", handleWindowMouseUp)
    }
  }, [handleWindowMouseMove, handleWindowMouseUp])

  const handleTrackEnd = () => {
    const next = (currentTrack + 1) % musicPlaylist.length
    selectTrack(next)
  }

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && audioRef.current.duration && !isDraggingRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0)
      setDuration(audioRef.current.duration || 0)
    }
  }, [])

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`
  }

  return (
    <MusicContext.Provider value={{ isPlaying, isHovering, currentTrack, track, togglePlay, selectTrack, progress, duration, dragProgress, handleMouseDown, handleProgressClick, formatTime }}>
      <audio
        ref={audioRef}
        src={track.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={handleTrackEnd}
      />

      {/* Fixed bottom-right player */}
      <div
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => { clearLeaveTimer(); setIsHovering(true) }}
        onMouseLeave={() => { if (Date.now() > keepOpenUntilRef.current) startLeaveTimer() }}
      >
        {/* Small dot — always visible */}
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#6C3FF5] to-[#FF9B6B] shadow-lg flex items-center justify-center cursor-pointer ${isPlaying ? "animate-spin" : ""}`}
          style={{ animationDuration: isPlaying ? "3s" : "0s", opacity: mounted && !isHovering ? 1 : 0, transition: "opacity 0.5s" }}
        >
          <span className="text-lg">🎵</span>
        </div>

        {/* Expanded panel — show on hover, covers dot */}
        <div
          className={`absolute bottom-0 right-0 transition-all duration-500 origin-bottom-right ${
            isHovering ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
          style={{ width: "14rem" }}
        >
          <div className="bg-card rounded-xl border border-border/60 shadow-xl overflow-hidden">
            {showList ? (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">播放列表</span>
                  <button onClick={() => setShowList(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                </div>
                <div className="space-y-1">
                  {musicPlaylist.map((song, i) => (
                    <button
                      key={i}
                      onClick={() => { setShowList(false); if (currentTrack !== i) selectTrack(i, false) }}
                      className={`w-full text-left p-2 rounded-lg transition-colors ${currentTrack === i ? "bg-primary/10 text-primary" : "hover:bg-accent/50"}`}
                    >
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground">{song.artist}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 p-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#FF9B6B] flex items-center justify-center ${isPlaying ? "animate-pulse" : ""}`}>
                    <span className="text-lg">🎵</span>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium">
                      <MarqueeText key={track.title} text={track.title} isActive={isPlaying} charCount={6} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <MarqueeText key={track.artist + track.title} text={track.artist} isActive={isPlaying} charCount={6} />
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlay() }}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0"
                  >
                    {isPlaying ? <span className="text-sm">⏸</span> : <span className="text-sm ml-0.5">▶</span>}
                  </button>
                </div>

                {/* Progress */}
                <div className="px-3 pb-2">
                  <div
                    className="h-1.5 bg-secondary rounded-full relative cursor-pointer group"
                    onMouseDown={handleMouseDown}
                    onClick={handleProgressClick}
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-primary rounded-full"
                      style={{ width: `${dragProgress ?? progress}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-md pointer-events-none"
                      style={{
                        left: `calc(${dragProgress ?? progress}% - 7px)`,
                        opacity: 1,
                        transition: "opacity 0.3s"
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-3 pb-1">
                  <span>{formatTime((progress / 100) * duration)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowList(true) }}
                    className="hover:text-foreground transition-colors"
                  >
                    播放列表 ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Marquee Animation */}
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
