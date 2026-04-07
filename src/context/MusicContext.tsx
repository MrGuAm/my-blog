"use client"

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react"

const musicPlaylist = [
  { title: "最美的太阳", artist: "张杰", src: "/music/张杰 - 最美的太阳.mp3" },
  { title: "着魔", artist: "张杰", src: "/music/张杰 - 着魔.mp3" },
  { title: "这里是神奇的赛尔号", artist: "张杰", src: "/music/张杰 - 这里是神奇的赛尔号（《赛尔号》动画插曲）.mp3" },
  { title: "这，就是爱", artist: "张杰", src: "/music/张杰 - 这，就是爱.mp3" },
]

interface MusicContextValue {
  isPlaying: boolean
  currentTrack: number
  track: typeof musicPlaylist[number]
  togglePlay: () => void
  selectTrack: (index: number) => void
}

const MusicContext = createContext<MusicContextValue>({
  isPlaying: false,
  currentTrack: 0,
  track: musicPlaylist[0],
  togglePlay: () => {},
  selectTrack: () => {},
})

export function MusicProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [showList, setShowList] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dragProgress, setDragProgress] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const progressBarRectRef = useRef<DOMRect | null>(null)

  const track = musicPlaylist[currentTrack]

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const selectTrack = useCallback((index: number) => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.src = musicPlaylist[index].src
    audioRef.current.load()
    setCurrentTrack(index)
    setShowList(false)
    setProgress(0)
    setIsPlaying(true)
    setDragging(false)
    setDragProgress(null)
    isDraggingRef.current = false
    window.removeEventListener("mousemove", handleWindowMouseMove)
    window.removeEventListener("mouseup", handleWindowMouseUp)
    setTimeout(() => audioRef.current?.play(), 100)
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (!audioRef.current || !audioRef.current.duration) return
    const rect = progressBarRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * audioRef.current.duration
    setProgress(pct * 100)
    setDragProgress(null)
  }, [])

  const handleWindowMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !progressBarRectRef.current) return
    const pct = Math.max(0, Math.min(1, (e.clientX - progressBarRectRef.current.left) / progressBarRectRef.current.width))
    setDragProgress(pct * 100)
  }, [])

  const handleWindowMouseUp = useCallback((e: MouseEvent) => {
    if (isDraggingRef.current && progressBarRectRef.current && audioRef.current) {
      const pct = Math.max(0, Math.min(1, (e.clientX - progressBarRectRef.current.left) / progressBarRectRef.current.width))
      if (audioRef.current.duration) {
        audioRef.current.currentTime = pct * audioRef.current.duration
        setProgress(pct * 100)
      }
      setDragProgress(null)
    }
    isDraggingRef.current = false
    setDragging(false)
    window.removeEventListener("mousemove", handleWindowMouseMove)
    window.removeEventListener("mouseup", handleWindowMouseUp)
  }, [handleWindowMouseMove])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!progressBarRef.current) return
    isDraggingRef.current = true
    progressBarRectRef.current = progressBarRef.current.getBoundingClientRect()
    window.addEventListener("mousemove", handleWindowMouseMove)
    window.addEventListener("mouseup", handleWindowMouseUp)
  }, [handleWindowMouseMove])

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

  const setDragging = (v: boolean) => { isDraggingRef.current = v }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`
  }

  return (
    <MusicContext.Provider value={{ isPlaying, currentTrack, track, togglePlay, selectTrack }}>
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
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Small dot — always visible */}
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#6C3FF5] to-[#FF9B6B] shadow-lg flex items-center justify-center cursor-pointer ${isPlaying ? "animate-spin" : ""}`}
          style={{ animationDuration: isPlaying ? "3s" : "0s" }}
        >
          <span className="text-lg">🎵</span>
        </div>

        {/* Expanded panel — show on hover */}
        <div
          className={`absolute bottom-0 right-0 transition-all duration-300 origin-bottom-right pointer-events-none ${
            isHovering ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
          style={{ width: "288px" }}
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
                      onClick={() => selectTrack(i)}
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
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlay() }}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0"
                  >
                    {isPlaying ? <span className="text-sm">⏸</span> : <span className="text-sm ml-0.5">▶</span>}
                  </button>
                </div>

                {/* Progress */}
                <div className="px-3 pb-2" onClick={(e) => e.stopPropagation()}>
                  <div
                    className="h-1.5 bg-secondary rounded-full relative cursor-pointer"
                    onClick={handleMouseDown}
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-primary rounded-full"
                      style={{ width: `${dragProgress ?? progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-3 pb-1">
                  <span>{formatTime((progress / 100) * duration)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowList(true) }}
                    className="hover:text-foreground transition-colors"
                  >
                    播放列表 →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  return useContext(MusicContext)
}
