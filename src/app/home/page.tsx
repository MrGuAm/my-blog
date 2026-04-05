"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"

// Character eye component that follows mouse
function CharacterEye({ isHovered, mouseX, mouseY, containerRef, eyeColor, pupilColor, size }: { isHovered: boolean; mouseX: number; mouseY: number; containerRef: React.RefObject<HTMLDivElement | null>; eyeColor: string; pupilColor: string; size: number }) {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isHovered || !containerRef.current) {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), size * 0.3);
      const angle = Math.atan2(deltaY, deltaX);
      setPupilOffset({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isHovered, containerRef, size]);

  if (!isHovered) {
    // Closed eyes - simple line
    return (
      <div className="relative" style={{ width: size, height: size * 0.4 }}>
        <div className="absolute left-0 w-full h-0.5 bg-[#2D2D2D] rounded-full top-1/2 -translate-y-1/2" />
      </div>
    );
  }

  // Open eyes with pupil
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div 
        className="absolute rounded-full bg-white"
        style={{ width: size * 0.8, height: size * 0.8, left: size * 0.1, top: size * 0.1 }}
      >
        <div 
          className="absolute rounded-full"
          style={{ 
            width: size * 0.4, 
            height: size * 0.4, 
            backgroundColor: pupilColor,
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${pupilOffset.x}px), calc(-50% + ${pupilOffset.y}px))`,
            transition: 'transform 0.1s ease-out'
          }}
        />
      </div>
    </div>
  );
}

// Full character component
function Character({ type, isHovered, mouseX, mouseY }: { type: number; isHovered: boolean; mouseX: number; mouseY: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const configs = [
    { bg: '#6C3FF5', width: 40, height: 60, eyeColor: 'white', pupilColor: '#2D2D2D', eyeSize: 8 },
    { bg: '#2D2D2D', width: 32, height: 48, eyeColor: 'white', pupilColor: '#2D2D2D', eyeSize: 7 },
    { bg: '#FF9B6B', width: 48, height: 28, eyeColor: '#2D2D2D', pupilColor: '#2D2D2D', eyeSize: 6 },
    { bg: '#E8D754', width: 32, height: 40, eyeColor: '#2D2D2D', pupilColor: '#2D2D2D', eyeSize: 6 },
  ];
  const config = configs[type % configs.length];

  return (
    <div 
      ref={ref}
      className="relative rounded-lg"
      style={{ 
        width: config.width, 
        height: config.height, 
        backgroundColor: config.bg,
      }}
    >
      <div className="absolute flex gap-2" style={{ 
        left: type === 2 ? 8 : 6, 
        top: type === 2 ? 6 : 8 
      }}>
        <CharacterEye 
          isHovered={isHovered} 
          mouseX={mouseX} 
          mouseY={mouseY} 
          containerRef={ref}
          eyeColor={config.eyeColor}
          pupilColor={config.pupilColor}
          size={config.eyeSize}
        />
        <CharacterEye 
          isHovered={isHovered} 
          mouseX={mouseX} 
          mouseY={mouseY} 
          containerRef={ref}
          eyeColor={config.eyeColor}
          pupilColor={config.pupilColor}
          size={config.eyeSize}
        />
      </div>
      {/* Mouth for yellow character */}
      {type === 3 && (
        <div 
          className="absolute h-0.5 bg-[#2D2D2D] rounded-full"
          style={{ width: 12, left: 10, bottom: 8 }}
        />
      )}
    </div>
  );
}

// Post card with character that follows mouse
function PostCard({ post, characterType }: { post: typeof posts[0]; characterType: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <Link 
      href={`/posts/${post.id}`}
      className="block p-6 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-accent/30 transition-all group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
          {post.category}
        </span>
        <span className="text-xs text-muted-foreground">{post.date}</span>
      </div>
      <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
        {post.title}
      </h2>
      <p className="text-muted-foreground text-sm">{post.excerpt}</p>
      <div className="mt-4 flex items-center gap-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        Read more →
      </div>
      {/* Character decoration */}
      <div className="absolute bottom-3 right-3 transition-all duration-300">
        <Character 
          type={characterType} 
          isHovered={isHovered} 
          mouseX={mousePos.x} 
          mouseY={mousePos.y} 
        />
      </div>
    </Link>
  );
}

const posts = [
  {
    id: 1,
    title: "欢迎来到 Champion 的博客",
    excerpt: "这是我的第一篇博客文章，记录了我开始写博客的心情和想法...",
    date: "2026-04-01",
    category: "随笔"
  },
  {
    id: 2,
    title: "React Hooks 入门指南",
    excerpt: "React Hooks 是 React 16.8 引入的新特性，它让我们可以在函数组件中使用状态和其他 React 特性...",
    date: "2026-04-03",
    category: "技术"
  },
  {
    id: 3,
    title: "如何保持专注",
    excerpt: "在这个信息爆炸的时代，保持专注变得越来越困难。这篇文章分享了一些我的经验...",
    date: "2026-04-05",
    category: "生活"
  },
]

const musicPlaylist = [
  { title: "最美的太阳", artist: "张杰", src: "/music/张杰 - 最美的太阳.mp3" },
  { title: "着魔", artist: "张杰", src: "/music/张杰 - 着魔.mp3" },
  { title: "这里是神奇的赛尔号", artist: "张杰", src: "/music/张杰 - 这里是神奇的赛尔号（《赛尔号》动画插曲）.mp3" },
  { title: "这，就是爱", artist: "张杰", src: "/music/张杰 - 这，就是爱.mp3" },
]

export default function HomePage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [showList, setShowList] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dragProgress, setDragProgress] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const progressBarRectRef = useRef<DOMRect | null>(null)
  const dragStartXRef = useRef(0)
  const dragStartProgressRef = useRef(0)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const selectTrack = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = musicPlaylist[index].src
      audioRef.current.load()
      setCurrentTrack(index)
      setShowList(false)
      setProgress(0)
      setIsPlaying(true)
      // Reset drag state when switching tracks
      setIsDragging(false)
      setDragProgress(null)
      isDraggingRef.current = false
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
      setTimeout(() => {
        audioRef.current?.play()
      }, 100)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (!audioRef.current || !audioRef.current.duration) return
    const rect = progressBarRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * audioRef.current.duration
    setProgress(pct * 100)
    setDragProgress(null)
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!progressBarRef.current) return
    isDraggingRef.current = true
    setIsDragging(true)
    progressBarRectRef.current = progressBarRef.current.getBoundingClientRect()
    dragStartXRef.current = e.clientX
    dragStartProgressRef.current = progress
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
  }, [progress]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleWindowMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !progressBarRectRef.current) return
    const rect = progressBarRectRef.current
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setDragProgress(pct * 100)
  }, [])

  const handleWindowMouseUp = useCallback((e: MouseEvent) => {
    if (isDraggingRef.current && progressBarRectRef.current && audioRef.current) {
      const rect = progressBarRectRef.current
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      if (audioRef.current.duration) {
        audioRef.current.currentTime = pct * audioRef.current.duration
        setProgress(pct * 100)
      }
      setDragProgress(null)
    }
    isDraggingRef.current = false
    setIsDragging(false)
    window.removeEventListener('mousemove', handleWindowMouseMove)
    window.removeEventListener('mouseup', handleWindowMouseUp)
  }, [handleWindowMouseMove])

  const handleMouseMove = (e: React.MouseEvent) => {
    // Ignore - all drag handling via window listeners
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    // Window listener handles the real work
  }

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && audioRef.current.duration && !isDraggingRef.current) {
      const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(pct || 0)
      setDuration(audioRef.current.duration || 0)
    }
  }, [])

  // Cleanup global listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [handleWindowMouseMove, handleWindowMouseUp])

  const handleTrackEnd = () => {
    // Loop: play next track or restart from beginning
    const nextIndex = (currentTrack + 1) % musicPlaylist.length
    selectTrack(nextIndex)
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const track = musicPlaylist[currentTrack]

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={track.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={handleTrackEnd}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#6C3FF5]/60 flex items-center justify-center">
                <span className="text-white text-sm font-bold">C</span>
              </div>
              <span className="font-black text-lg">Champion&apos;s Blog</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/home" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6">
        {/* Hero Section */}
        <section className="py-16">
          <h1 className="text-4xl font-black tracking-tight mb-4">
            Welcome to my blog
          </h1>
          <p className="text-muted-foreground text-lg">
            记录生活，分享想法
          </p>
        </section>

        {/* Decorative line */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#6C3FF5] to-[#FF9B6B]" />
          <div className="w-3 h-3 rounded-full bg-[#E8D754]" />
          <div className="w-2 h-2 rounded-full bg-[#2D2D2D]" />
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-8 pb-20">
          {/* Blog Posts */}
          <main className="flex-1 space-y-6">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} characterType={index} />
            ))}
          </main>

          {/* Sidebar Music Player */}
          <aside className="w-56 flex-shrink-0">
            <div 
              className="sticky top-24 bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => { if (!isDragging) setIsHovering(false) }}
            >
              {/* Song List */}
              {showList ? (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">播放列表</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowList(false) }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1">
                    {musicPlaylist.map((song, index) => (
                      <button
                        key={index}
                        onClick={() => selectTrack(index)}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          currentTrack === index 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <p className="text-sm font-medium truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground">{song.artist}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Compact Player */
                <div 
                  className="p-3 cursor-pointer relative"
                  onClick={() => setShowList(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#FF9B6B] flex items-center justify-center flex-shrink-0 ${isPlaying ? 'animate-pulse' : ''}`}>
                      <span className="text-lg">🎵</span>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className={`text-sm font-medium ${track.title.length > 12 && isPlaying ? 'animate-marquee whitespace-nowrap' : 'truncate'}`}>{track.title}</p>
                      <p className={`text-xs text-muted-foreground ${track.artist.length > 12 && isPlaying ? 'animate-marquee whitespace-nowrap' : 'truncate'}`}>{track.artist}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePlay() }}
                      className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0"
                    >
                      {isPlaying ? <span className="text-sm">⏸</span> : <span className="text-sm ml-0.5">▶</span>}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  {/* Progress Bar */}
                  <div 
                    ref={progressBarRef}
                    className={`transition-all duration-300 ease-out overflow-hidden ${isHovering || isDragging ? 'mt-3 pt-3 border-t border-border/40 opacity-100 max-h-20' : 'mt-0 pt-0 border-t-0 opacity-0 max-h-0'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div 
                      className="h-1.5 bg-secondary rounded-full relative cursor-pointer" 
                      onMouseDown={handleMouseDown} 
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="absolute top-0 left-0 h-full bg-primary rounded-full"
                        style={{ width: `${dragProgress !== null ? dragProgress : progress}%` }}
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg"
                        style={{ left: `${dragProgress !== null ? dragProgress : progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatTime(((dragProgress !== null ? dragProgress : progress) / 100) * duration)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  {/* Always visible thin progress line when NOT hovering - at the bottom */}
                  {!isHovering && !isDragging && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/60 overflow-hidden cursor-pointer" onClick={handleProgressClick} style={{ borderRadius: '0 0 0.5rem 0.5rem' }}>
                      <div 
                        className="h-full bg-primary/70 rounded-full transition-none"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Champion&apos;s Blog
        </div>
      </footer>

      {/* Marquee Animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 6s linear infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  )
}
