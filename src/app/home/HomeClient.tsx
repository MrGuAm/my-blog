"use client"
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Post } from "@/lib/posts"
import LoginModal from "@/components/LoginModal"
import MarqueeText from "@/components/music/MarqueeText"
import { useMusic } from "@/context/MusicContext"
import { useAuthStatus } from "@/hooks/useAuthStatus"

interface HomeClientProps {
  posts: Post[]
  allTags: string[]
  loginRequested?: boolean
  nextPath?: string | null
}

interface RecentComment {
  id: string
  postId: string
  author: string
  content: string
  date: string
}

function CardAccent() {
  return (
    <div className="flex items-center gap-1.5 opacity-80">
      <span className="h-2.5 w-2.5 rounded-full bg-slate-900/80 dark:bg-white/85" />
      <span className="h-2 w-2 rounded-full bg-slate-400/80 dark:bg-white/45" />
      <span className="h-1.5 w-8 rounded-full bg-slate-300 dark:bg-white/20" />
    </div>
  )
}

// Minimal post card
function PostCard({
  post,
  isAuthenticated,
  onTagClick,
  onPlayBgm,
  isCurrentBgm,
}: {
  post: Post
  isAuthenticated: boolean
  onTagClick: (tag: string) => void
  onPlayBgm: (src?: string | null) => void
  isCurrentBgm: boolean
}) {
  const postHref = post.draft && isAuthenticated ? `/write/${post.id}` : `/posts/${post.slug || post.id}`
  return (
    <article className="apple-panel group overflow-hidden rounded-[2rem] p-5 transition-all duration-300 hover:-translate-y-0.5 sm:p-6">
      {post.coverImage && (
        <div className="mb-5 overflow-hidden rounded-[1.75rem] border border-white/70 dark:border-white/10">
          <img src={post.coverImage} alt={post.title} className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="apple-pill">
          {post.category}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{post.date}</span>
          {post.pinned && (
            <span className="rounded-full bg-[#111827] px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-slate-900">
              置顶
            </span>
          )}
          {post.draft && (
            <span className="apple-pill">
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
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                isCurrentBgm
                  ? "bg-[#111827] text-white dark:bg-white dark:text-slate-900"
                  : "border border-white/70 bg-white/72 text-foreground/80 backdrop-blur-xl hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-white/80"
              }`}
            >
              {isCurrentBgm ? "当前 BGM" : "播放 BGM"}
            </button>
          )}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <button
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
              className="apple-pill hover:bg-white dark:hover:bg-white/12"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
      <Link href={postHref} className="block">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground transition-colors group-hover:text-foreground/80">
          {post.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-[15px]">{post.excerpt}</p>
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground/80">
            {post.draft ? "继续编辑" : "继续阅读"}
          </span>
          <div className="flex items-center gap-3">
            <CardAccent />
            <span className="text-lg text-foreground/65 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function HomeClient({ posts, allTags, loginRequested = false, nextPath = null }: HomeClientProps) {
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
    toggleFavorite,
    isFavorite,
    progress,
    duration,
    dragProgress,
    handleMouseDown,
    handleProgressClick,
    formatTime,
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

  const getSafeNextPath = (value: string | null) => {
    if (!value) return null
    return value.startsWith("/") && !value.startsWith("//") ? value : null
  }

  const closeLoginModal = () => {
    setIsLoginModalOpen(false)
    if (!loginRequested) return
    router.replace("/home")
  }

  const loginModalOpen = isLoginModalOpen || (loginRequested && !isAuthenticated)

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
    <div className="min-h-screen text-foreground">
      {/* Navigation */}
      <nav className="apple-nav sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#111827] text-sm font-semibold text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-900">
                <span className="text-sm font-bold text-current">C</span>
              </div>
              <span className="text-lg font-semibold tracking-[-0.03em] text-foreground">Champion&apos;s Blog</span>
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
                  className="apple-input w-full pl-9 pr-9 sm:w-56"
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
                <span className="apple-pill">
                  #{selectedTag}
                </span>
              )}
              <span className="text-xs text-muted-foreground hidden lg:inline">
                共 {filteredPosts.length} 篇
              </span>
              <Link href="/home" className="text-sm font-medium text-foreground transition-colors hover:text-foreground/70">
                Home
              </Link>
              <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/70">
                About
              </Link>
              <Link href="/music" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/70">
                Music
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/write"
                    className="text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
                  >
                    写文章
                  </Link>
                  <Link
                    href="/moderation"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/70"
                  >
                    审核评论
                  </Link>
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/70"
                  >
                    后台
                  </Link>
                  <button
                    onClick={() => {
                      setShowDrafts(!showDrafts)
                      setCurrentPage(1)
                    }}
                    className={`text-sm font-medium transition-colors ${showDrafts ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'}`}
                  >
                    {showDrafts ? '隐藏草稿' : '显示草稿'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-500 transition-colors hover:text-red-600"
                  >
                    退出
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="apple-button-secondary"
                  title="仅站点管理员使用"
                >
                  管理
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <section className="pb-10 pt-8 sm:pb-16 sm:pt-12">
          <div className="apple-panel rounded-[2.5rem] px-6 py-8 sm:px-10 sm:py-12">
            <span className="apple-pill inline-flex">Notes · Stories · Sound</span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.07em] text-foreground sm:text-6xl">
              一个更安静、更克制的个人博客。
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              用来记录生活、技术和那些值得留下来的想法，也把音乐和写作放在同一个流畅的阅读空间里。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="apple-pill">{filteredPosts.length} 篇文章</span>
              <span className="apple-pill">{allTags.length} 个标签</span>
              <span className="apple-pill">{playlist.length} 首音乐</span>
            </div>
          </div>
        </section>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col gap-6 pb-24 lg:flex-row lg:gap-10">
          {/* Blog Posts */}
          <main className="flex-1 space-y-5">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Latest Writing</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">最近更新</h2>
              </div>
              <p className="hidden text-sm text-muted-foreground sm:block">向下翻，慢慢读。</p>
            </div>
            {paginatedPosts.length > 0 ? (
              paginatedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
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
              <div className="apple-panel-soft rounded-[2rem] py-16 text-center">
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
              <div className="apple-panel-soft flex items-center justify-between rounded-[1.5rem] px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  第 {safeCurrentPage} / {totalPages} 页
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                    className="apple-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="apple-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="w-full flex-shrink-0 lg:sticky lg:top-24 lg:w-56 lg:self-start">
            <div className="space-y-4">
              {/* Player */}
              <div
                className="apple-panel overflow-hidden rounded-[1.75rem]"
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

            {/* Latest Posts */}
            <div className="apple-panel-soft overflow-hidden rounded-[1.75rem]">
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
              <div className="apple-panel-soft overflow-hidden rounded-[1.75rem]">
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
            <div className="apple-panel-soft overflow-hidden rounded-[1.75rem]">
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
        isOpen={loginModalOpen}
        onClose={closeLoginModal}
        onSuccess={() => {
          const safeNextPath = getSafeNextPath(nextPath)
          if (safeNextPath) {
            router.push(safeNextPath)
            return
          }
          if (loginRequested) {
            router.replace("/home")
          }
        }}
      />

      {/* Footer */}
      <footer className="border-t border-white/60 py-10 dark:border-white/10">
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
        className={`apple-panel fixed bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full text-lg text-foreground transition-all duration-300 hover:bg-white dark:hover:bg-white/12 ${
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        } ${floatingHovering ? "right-[17rem]" : "right-[80px]"}`}
        aria-label="回到顶部"
      >
        ↑
      </button>
    </div>
  )
}
