"use client"

import { useEffect, useRef } from "react"

interface LyricLine {
  time: number
  text: string
}

interface SyncedLyricsPanelProps {
  lyrics: LyricLine[]
  activeIndex: number
  onSeek?: (time: number) => void
  height?: number
  emptyText?: string
  variant?: "compact" | "page"
}

export default function SyncedLyricsPanel({
  lyrics,
  activeIndex,
  onSeek,
  height = 176,
  emptyText = "当前歌曲没有可滚动的时间轴歌词。",
  variant = "compact",
}: SyncedLyricsPanelProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)
  const activeLineRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const viewport = viewportRef.current
    const activeLine = activeLineRef.current
    const inner = innerRef.current

    if (!inner) return

    if (!viewport || !activeLine || activeIndex < 0) {
      inner.style.transform = "translateY(0px)"
      return
    }

    const nextOffset = viewport.clientHeight / 2 - (activeLine.offsetTop + activeLine.offsetHeight / 2)
    inner.style.transform = `translateY(${nextOffset}px)`
  }, [activeIndex, lyrics])

  if (lyrics.length === 0) {
    return <p className="text-sm leading-6 text-muted-foreground">{emptyText}</p>
  }

  const activeClasses =
    variant === "page"
      ? "bg-primary/10 text-primary font-bold text-base scale-[1.02] opacity-100"
      : "text-primary font-bold text-sm scale-[1.14] opacity-100 tracking-[0.01em]"

  const beforeClasses =
    variant === "page"
      ? "text-foreground/65 opacity-55"
      : "text-foreground/65 opacity-35"

  const afterClasses =
    variant === "page"
      ? "text-muted-foreground opacity-80 hover:bg-accent/40 hover:text-foreground"
      : "text-muted-foreground opacity-50 hover:bg-accent/30 hover:text-foreground"

  const baseClasses =
    variant === "page"
      ? "block w-full rounded-2xl px-3 py-2 text-center text-sm leading-6 transition-all duration-300"
      : "block w-full rounded-2xl px-3 py-2 text-center text-xs leading-5 transition-all duration-300"

  return (
    <div ref={viewportRef} className="overflow-hidden px-1 text-center" style={{ height }}>
      <div
        ref={innerRef}
        className="will-change-transform transition-transform duration-500 ease-out"
        style={{ transform: "translateY(0px)" }}
      >
        {lyrics.map((line, index) => (
          <button
            key={`${line.time}-${index}`}
            ref={index === activeIndex ? activeLineRef : null}
            type="button"
            onClick={() => onSeek?.(line.time)}
            className={`${baseClasses} ${
              index === activeIndex ? activeClasses : index < activeIndex ? beforeClasses : afterClasses
            }`}
            style={{ transformOrigin: "center center" }}
          >
            {line.text}
          </button>
        ))}
      </div>
    </div>
  )
}
