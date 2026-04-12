"use client"
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Post } from "@/lib/posts"
import LoginModal from "@/components/LoginModal"
import { useMusic } from "@/context/MusicContext"
import { useAuthStatus } from "@/hooks/useAuthStatus"

interface HomeClientProps {
  posts: Post[]
  allTags: string[]
}

interface RecentComment {
  id: string
  postId: string
  author: string
  content: string
  date: string
}

// Simple marquee text using CSS
function MarqueeText({ text, isActive, charCount = 6 }: { text: string; isActive: boolean; charCount?: number }) {
  return (
    <span className="block max-w-full overflow-hidden leading-tight">
      {text.length <= charCount || !isActive ? (
        <span className="block truncate">{text}</span>
      ) : (
        <span
          className="inline-block animate-marquee"
          style={{ whiteSpace: "nowrap" }}
        >
          {text}
        </span>
      )}
    </span>
  )
}

function SyncedLyrics({ lyrics, activeIndex, onSeek }: { lyrics: Array<{ time: number; text: string }>; activeIndex: number; onSeek: (time: number) => void }) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)
  const activeLineRef = useRef<HTMLParagraphElement | null>(null)

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
    return <p className="text-xs text-muted-foreground leading-5">当前歌曲没有可滚动的时间轴歌词。</p>
  }

  return (
    <div ref={viewportRef} className="overflow-hidden px-1 text-center" style={{ height: 176 }}>
      <div
        ref={innerRef}
        className="transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: "translateY(0px)" }}
      >
      {lyrics.map((line, index) => (
        <p
          key={`${line.time}-${index}`}
          ref={index === activeIndex ? activeLineRef : null}
          style={{ transformOrigin: "center center" }}
          onClick={() => onSeek(line.time)}
          className={`px-3 py-2 text-xs leading-5 transition-all duration-300 ${
            index === activeIndex
              ? "text-primary font-bold text-sm scale-[1.14] opacity-100 tracking-[0.01em]"
              : index < activeIndex
                ? "text-foreground/65 scale-100 opacity-35"
                : "text-muted-foreground scale-100 opacity-50"
          } cursor-pointer`}
        >
          {line.text}
        </p>
      ))}
      </div>
    </div>
  )
}
function CharacterEye({ isHovered, containerRef, pupilColor, size }: { isHovered: boolean; containerRef: React.RefObject<HTMLDivElement | null>; pupilColor: string; size: number }) {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const displayedOffset = isHovered ? pupilOffset : { x: 0, y: 0 };

  useEffect(() => {
    if (!isHovered || !containerRef.current) {
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
            transform: `translate(calc(-50% + ${displayedOffset.x}px), calc(-50% + ${displayedOffset.y}px))`,
            transition: 'transform 0.1s ease-out'
          }}
        />
      </div>
    </div>
  );
}

// Full character component
function Character({ type, isHovered }: { type: number; isHovered: boolean }) {
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
          containerRef={ref}
          pupilColor={config.pupilColor}
          size={config.eyeSize}
        />
        <CharacterEye
          isHovered={isHovered}
          containerRef={ref}
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
function PostCard({
  post,
  characterType,
  isAuthenticated,
  onTagClick,
  onPlayBgm,
  isCurrentBgm,
}: {
  post: Post
  characterType: number
  isAuthenticated: boolean
  onTagClick: (tag: string) => void
  onPlayBgm: (src?: string | null) => void
  isCurrentBgm: boolean
}) {
  const [isHovered, setIsHovered] = useState(false);

  const postHref = post.draft && isAuthenticated ? `/write/${post.id}` : `/posts/${post.slug || post.id}`
  return (
    <div
      className="block p-6 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-accent/30 transition-all group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {post.coverImage && (
        <div className="mb-4 overflow-hidden rounded-xl border border-border/40">
          <img src={post.coverImage} alt={post.title} className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
      )}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
          {post.category}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{post.date}</span>
          {post.pinned && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
              置顶
            </span>
          )}
          {post.draft && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
              草稿
            </span>
          )}
          {post.bgmSrc && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onPlayBgm(post.bgmSrc)
              }}
              className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                isCurrentBgm
                  ? "bg-primary text-primary-foreground"
                  : "bg-[#FF9B6B]/15 text-[#FF9B6B] hover:bg-[#FF9B6B]/25"
              }`}
            >
              {isCurrentBgm ? "当前 BGM" : "播放 BGM"}
            </button>
          )}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {post.tags.map(tag => (
            <button
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
              className="text-xs px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
      <Link href={postHref}>
        <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
          {post.title}
        </h2>
        <p className="text-muted-foreground text-sm">{post.excerpt}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          {post.draft ? "编辑 →" : "Read more →"}
        </div>
      </Link>
      {/* Character decoration */}
      <div className="absolute bottom-3 right-3 transition-all duration-300">
        <Character
          type={characterType}
          isHovered={isHovered}
        />
      </div>
    </div>
  );
}

export default function HomeClient({ posts, allTags }: HomeClientProps) {
  const router = useRouter()
  const {
    playlist,
    isPlaying,
    isHovering: floatingHovering,
    currentTrack,
    track,
    playMode,
    togglePlay,
    cyclePlayMode,
    playPrevious,
    playNext,
    selectTrack,
    playTrackBySrc,
    currentLyrics,
    parsedLyrics,
    activeLyricIndex,
    recentTracks,
    favoriteTracks,
    toggleFavorite,
    isFavorite,
    progress,
    duration,
    dragProgress,
    handleMouseDown,
    handleProgressClick,
    formatTime,
    seekToTime,
  } = useMusic()
  const { isAuthenticated, logout } = useAuthStatus()
  const [showDrafts, setShowDrafts] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [recentComments, setRecentComments] = useState<RecentComment[]>([])
  const [adminPosts, setAdminPosts] = useState<Post[] | null>(null)
  const [showList, setShowList] = useState(false)
  const [isSidebarHovering, setIsSidebarHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 6

  const visiblePosts = isAuthenticated ? (adminPosts ?? posts) : posts

  // Scroll listener for back to top
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch recent comments
  useEffect(() => {
    fetch('/api/comments')
      .then(r => r.json())
      .then(data => setRecentComments(data.comments || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    fetch('/api/posts', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setAdminPosts(Array.isArray(data) ? data : null))
      .catch(() => setAdminPosts(null))
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
    router.push('/home');
  };

  const filteredPosts = visiblePosts.filter(post =>
    (showDrafts || !post.draft) &&
    (searchQuery === "" ||
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (selectedTag === null || post.tags.includes(selectedTag))
  ).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedPosts = filteredPosts.slice((safeCurrentPage - 1) * postsPerPage, safeCurrentPage * postsPerPage)
  const playModeLabel = playMode === "loop" ? "列表循环" : playMode === "repeat-one" ? "单曲循环" : "随机播放"

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#6C3FF5]/60 flex items-center justify-center">
                <span className="text-white text-sm font-bold">C</span>
              </div>
              <span className="font-black text-lg">Champion&apos;s Blog</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="搜索文章或标签..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full sm:w-48 px-3 py-1.5 pl-8 text-sm bg-secondary/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
                {(searchQuery || selectedTag) && (
                  <button
                    onClick={() => { setSearchQuery(""); setSelectedTag(null); setCurrentPage(1) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                  >
                    ✕
                  </button>
                )}
              </div>
              {selectedTag && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  #{selectedTag}
                </span>
              )}
              <span className="text-xs text-muted-foreground hidden lg:inline">
                共 {filteredPosts.length} 篇
              </span>
              <Link href="/home" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/music" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Music
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/write"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    写文章
                  </Link>
                  <Link
                    href="/moderation"
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    审核评论
                  </Link>
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    后台
                  </Link>
                  <button
                    onClick={() => {
                      setShowDrafts(!showDrafts)
                      setCurrentPage(1)
                    }}
                    className={`text-sm font-medium transition-colors ${showDrafts ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                  >
                    {showDrafts ? '隐藏草稿' : '显示草稿'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                  >
                    退出
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  登录
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <section className="py-10 sm:py-16">
          <h1 className="text-3xl font-black tracking-tight mb-4 sm:text-4xl">
            Welcome to my blog
          </h1>
          <p className="text-muted-foreground text-lg">
            记录生活,分享想法
          </p>
        </section>

        {/* Decorative line */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#6C3FF5] to-[#FF9B6B]" />
          <div className="w-3 h-3 rounded-full bg-[#E8D754]" />
          <div className="w-2 h-2 rounded-full bg-[#2D2D2D]" />
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col gap-6 pb-20 lg:flex-row lg:gap-8">
          {/* Blog Posts */}
          <main className="flex-1 space-y-6">
            {paginatedPosts.length > 0 ? (
              paginatedPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  characterType={index % 4}
                  isAuthenticated={isAuthenticated}
                  onPlayBgm={(src) => playTrackBySrc(src)}
                  isCurrentBgm={Boolean(post.bgmSrc && track.src === post.bgmSrc)}
                  onTagClick={(tag) => {
                    setSelectedTag(tag)
                    setCurrentPage(1)
                  }}
                />
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-2">没有找到匹配的文章</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedTag(null); setCurrentPage(1) }}
                  className="text-sm text-primary hover:underline"
                >
                  清除筛选
                </button>
              </div>
            )}
            {filteredPosts.length > postsPerPage && (
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  第 {safeCurrentPage} / {totalPages} 页
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-border/50 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-border/50 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="w-full flex-shrink-0 lg:w-56">
            <div className="sticky top-24 space-y-4">
              {/* Player */}
              <div
                className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden"
                onMouseEnter={() => setIsSidebarHovering(true)}
                onMouseLeave={() => { if (!isDragging) setIsSidebarHovering(false) }}
              >
              {/* Song List */}
              {showList ? (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">播放列表</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowList(false) }}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1">
                    {playlist.map((song, index) => (
                      <div
                        key={song.src}
                        onClick={() => { setShowList(false); if (currentTrack !== index) selectTrack(index, false) }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setShowList(false)
                            if (currentTrack !== index) selectTrack(index, false)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={`w-full cursor-pointer text-left p-2 rounded-lg transition-colors ${
                          currentTrack === index
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-secondary/40 flex items-center justify-center">
                            {song.coverUrl ? <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" /> : <span>🎵</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{song.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(song.src) }}
                            className="text-sm"
                          >
                            {isFavorite(song.src) ? "❤️" : "🤍"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Compact Player */
                <div
                  className="p-3 cursor-pointer relative"
                  onClick={() => { if (!isDragging) setShowList(true) }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#6C3FF5] to-[#FF9B6B] flex items-center justify-center flex-shrink-0 ${isPlaying ? 'animate-pulse' : ''}`}>
                      {track.coverUrl ? <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" /> : <span className="text-lg">🎵</span>}
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
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(track.src) }}
                      className="text-sm flex-shrink-0"
                    >
                      {isFavorite(track.src) ? "❤️" : "🤍"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePlay() }}
                      className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0"
                    >
                      {isPlaying ? <span className="text-sm">⏸</span> : <span className="text-sm ml-0.5">▶</span>}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div
                    className={`transition-all duration-300 ease-out overflow-visible ${isSidebarHovering || isDragging ? 'mt-3 pt-3 border-t border-border/40 opacity-100 max-h-20' : 'mt-0 pt-0 border-t-0 opacity-0 max-h-0'}`}
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); playPrevious() }}
                        className="hover:text-foreground transition-colors"
                      >
                        ⏮
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); cyclePlayMode() }}
                        className="hover:text-foreground transition-colors"
                        title={playModeLabel}
                      >
                        {playMode === "loop" ? "🔁" : playMode === "repeat-one" ? "🔂" : "🔀"} {playModeLabel}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); playNext() }}
                        className="hover:text-foreground transition-colors"
                      >
                        ⏭
                      </button>
                    </div>
                    <div
                      className="h-1.5 bg-secondary rounded-full relative cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => { setIsDragging(true); handleMouseDown(e); }}
                      onClick={(e) => { handleProgressClick(e); setTimeout(() => setIsDragging(false), 0); }}
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
                  {!isSidebarHovering && !isDragging && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/60 overflow-visible cursor-pointer"
                      onClick={(e) => { handleProgressClick(e); setTimeout(() => setIsDragging(false), 0); }}
                      style={{ borderRadius: '0 0 0.5rem 0.5rem' }}
                    >
                      <div
                        className="h-full bg-primary/70 rounded-full transition-none"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {(currentLyrics.length > 0 || favoriteTracks.length > 0 || recentTracks.length > 0) && (
              <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
                <div className="px-3 py-3 space-y-3">
                  {currentLyrics.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">当前歌词</h3>
                      <SyncedLyrics lyrics={parsedLyrics} activeIndex={activeLyricIndex} onSeek={seekToTime} />
                    </div>
                  )}
                  {favoriteTracks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">收藏歌曲</h3>
                      <div className="space-y-2">
                        {favoriteTracks.slice(0, 3).map((song) => (
                          <button key={song.src} onClick={() => playTrackBySrc(song.src, false)} className="block text-left text-xs hover:text-primary transition-colors">
                            {song.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {recentTracks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">最近播放</h3>
                      <div className="space-y-2">
                        {recentTracks.slice(0, 3).map((song) => (
                          <button key={song.src} onClick={() => playTrackBySrc(song.src, false)} className="block text-left text-xs hover:text-primary transition-colors">
                            {song.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Latest Posts */}
            <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
              <div className="px-3 pb-3 pt-3">
                <h3 className="text-sm font-semibold mb-2">最新文章</h3>
                <div className="space-y-2">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.slice(0, 3).map((post) => (
                        <Link
                          key={post.id}
                          href={post.draft && isAuthenticated ? `/write/${post.id}` : `/posts/${post.slug || post.id}`}
                          className="block text-sm hover:text-primary transition-colors group"
                        >
                          <p className="truncate group-hover:text-primary">{post.title}</p>
                          <p className="text-xs text-muted-foreground">{post.date}</p>
                        </Link>
                      ))
                  ) : (
                    <p className="text-xs text-muted-foreground">暂无文章</p>
                  )}
                </div>
              </div>
            </div>

            {/* Latest Comments */}
            {recentComments.length > 0 && (
              <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
                <div className="px-3 pb-3 pt-3">
                  <h3 className="text-sm font-semibold mb-2">最新评论</h3>
                  <div className="space-y-2">
                    {recentComments.slice(0, 3).map(comment => (
                      <Link
                        key={comment.id}
                        href={`/posts/${comment.postId}`}
                        className="block text-xs hover:text-primary transition-colors group"
                      >
                        <p className="truncate group-hover:text-primary">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{comment.author} · {comment.date}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
              <div className="px-3 pb-3 pt-3">
                <h3 className="text-sm font-semibold mb-2">标签</h3>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(selectedTag === tag ? null : tag)
                        setCurrentPage(1)
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                        selectedTag === tag
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/60 text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {}}
      />

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
          animation: marquee 20s linear infinite;
        }
      `}</style>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center text-lg z-40 ${
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        } ${floatingHovering ? "right-[17rem]" : "right-[80px]"}`}
        aria-label="回到顶部"
      >
        ↑
      </button>
    </div>
  )
}
