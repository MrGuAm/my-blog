"use client"
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useMemo, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import HighlightedText from "@/components/HighlightedText"
import { Post } from "@/lib/posts"
import { PaletteHeroTrio } from "@/components/PaletteCharacters"
import PrimaryNavLinks from "@/components/PrimaryNavLinks"
import SearchQueryInput from "@/components/SearchQueryInput"
import SiteBrand from "@/components/SiteBrand"
import SiteFooter from "@/components/SiteFooter"
import MarqueeText from "@/components/music/MarqueeText"
import { useMusic } from "@/context/MusicContext"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import { filterPostsForListing, getPostSearchMatchScope, getPostSearchSuggestions } from "@/lib/post-search"
import { pushRecentSearch, readRecentSearches } from "@/lib/recent-searches"
import type { SiteSettings } from "@/lib/site-settings"

interface HomeClientProps {
  posts: Post[]
  allTags: string[]
  allSeries: string[]
  siteSettings: SiteSettings
  initialSearchQuery?: string
  initialSelectedTag?: string | null
  initialPage?: number
  initialShowDrafts?: boolean
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
      <span className="h-2.5 w-2.5 rounded-full bg-[#4d5772]/88 dark:bg-white/88" />
      <span className="h-2 w-2 rounded-full bg-[#7b9bff]/78 dark:bg-[#7b9bff]/72" />
      <span className="h-1.5 w-8 rounded-full bg-[#ffb98f]/85 dark:bg-[#ffb98f]/45" />
    </div>
  )
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap text-foreground/82">
      <span className="text-[2rem] leading-none font-semibold tracking-[-0.06em] tabular-nums">{value}</span>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="apple-panel-soft overflow-hidden rounded-[1.75rem]">
      <div className="px-3 pb-3 pt-3">
        <h3 className="mb-2 text-sm font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function FeaturedStoryCard({
  post,
  isAuthenticated,
  searchQuery,
}: {
  post: Post
  isAuthenticated: boolean
  searchQuery: string
}) {
  const href = post.draft && isAuthenticated ? `/write/${post.id}` : `/posts/${post.slug || post.id}`
  const matchScope = getPostSearchMatchScope(post, searchQuery)
  const showContentMatch =
    Boolean(searchQuery.trim()) &&
    matchScope.content &&
    !matchScope.title &&
    !matchScope.excerpt &&
    !matchScope.category &&
    !matchScope.series &&
    !matchScope.tags

  return (
    <Link
      href={href}
      className="editorial-card-soft block h-full transition-all duration-300 hover:-translate-y-0.5"
    >
      {post.coverImage ? (
        <div className="mb-4 overflow-hidden rounded-[1.5rem] border border-white/70 dark:border-white/10">
          <img src={post.coverImage} alt={post.title} className="h-40 w-full object-cover" />
        </div>
      ) : null}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#ffb98f]/20 px-2.5 py-1 text-xs font-medium text-[#c46d35]">
          精选
        </span>
        <span className="text-xs text-muted-foreground">{post.date}</span>
        {post.series ? (
          <span className="apple-pill">
            系列：<HighlightedText text={post.series} query={searchQuery} />{post.seriesOrder ? ` · 第 ${post.seriesOrder} 篇` : ""}
          </span>
        ) : null}
        {showContentMatch ? (
          <span className="apple-pill">正文命中</span>
        ) : null}
      </div>
      <h3 className="text-xl font-semibold tracking-[-0.04em] text-foreground"><HighlightedText text={post.title} query={searchQuery} /></h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground"><HighlightedText text={post.excerpt} query={searchQuery} /></p>
      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground"><HighlightedText text={post.category} query={searchQuery} /></span>
        <span className="font-medium text-foreground/80">进入阅读 →</span>
      </div>
    </Link>
  )
}

function PostCard({
  post,
  isAuthenticated,
  onTagClick,
  onPlayBgm,
  isCurrentBgm,
  searchQuery,
}: {
  post: Post
  isAuthenticated: boolean
  onTagClick: (tag: string) => void
  onPlayBgm: (src?: string | null) => void
  isCurrentBgm: boolean
  searchQuery: string
}) {
  const postHref = post.draft && isAuthenticated ? `/write/${post.id}` : `/posts/${post.slug || post.id}`
  const matchScope = getPostSearchMatchScope(post, searchQuery)
  const showContentMatch =
    Boolean(searchQuery.trim()) &&
    matchScope.content &&
    !matchScope.title &&
    !matchScope.excerpt &&
    !matchScope.category &&
    !matchScope.series &&
    !matchScope.tags
  return (
    <article className="editorial-card group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 sm:p-6">
      {post.coverImage && (
        <div className="mb-5 overflow-hidden rounded-[1.75rem] border border-white/70 dark:border-white/10">
          <img src={post.coverImage} alt={post.title} className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="apple-pill">
          <HighlightedText text={post.category} query={searchQuery} />
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{post.date}</span>
          {post.featured && (
            <span className="rounded-full bg-[#ffb98f]/20 px-2.5 py-1 text-xs font-medium text-[#c46d35]">
              精选
            </span>
          )}
          {post.pinned && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
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
                  ? "bg-primary text-primary-foreground"
                  : "border border-white/70 bg-white/72 text-foreground/80 backdrop-blur-xl hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-white/80"
              }`}
            >
              {isCurrentBgm ? "当前 BGM" : "播放 BGM"}
            </button>
          )}
        </div>
        {post.series ? (
          <Link
            href={`/series/${encodeURIComponent(post.series)}`}
            onClick={(event) => event.stopPropagation()}
            className="apple-pill hover:bg-white dark:hover:bg-white/12"
          >
            系列：<HighlightedText text={post.series} query={searchQuery} />{post.seriesOrder ? ` · 第 ${post.seriesOrder} 篇` : ""}
          </Link>
        ) : null}
        {showContentMatch ? (
          <span className="apple-pill">正文命中</span>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <button
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
              className="apple-pill hover:bg-white dark:hover:bg-white/12"
            >
              #<HighlightedText text={tag} query={searchQuery} />
            </button>
          ))}
        </div>
      </div>
      <Link href={postHref} className="block">
        <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-foreground transition-colors group-hover:text-foreground/80">
          <HighlightedText text={post.title} query={searchQuery} />
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-muted-foreground"><HighlightedText text={post.excerpt} query={searchQuery} /></p>
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

function renderHomeTitle(title: string) {
  if (!title.includes("自己的")) return title
  const [before, ...afterParts] = title.split("自己的")
  return (
    <>
      {before}
      <span className="palette-gradient-text">自己的</span>
      {afterParts.join("自己的")}
    </>
  )
}

export default function HomeClient({
  posts,
  allTags,
  allSeries,
  siteSettings,
  initialSearchQuery = "",
  initialSelectedTag = null,
  initialPage = 1,
  initialShowDrafts = false,
  loginRequested = false,
  nextPath = null,
}: HomeClientProps) {
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
  const { isAuthenticated } = useAuthStatus()
  const [showDrafts, setShowDrafts] = useState(initialShowDrafts)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [recentComments, setRecentComments] = useState<RecentComment[]>([])
  const [adminPosts, setAdminPosts] = useState<Post[] | null>(null)
  const [showList, setShowList] = useState(false)
  const [isSidebarHovering, setIsSidebarHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches())
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [selectedTag, setSelectedTag] = useState<string | null>(initialSelectedTag)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const postsPerPage = 6

  const visiblePosts = isAuthenticated ? (adminPosts ?? posts) : posts
  const effectiveShowDrafts = isAuthenticated && showDrafts

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

  const filteredPosts = useMemo(
    () =>
      filterPostsForListing(visiblePosts, {
        includeDrafts: effectiveShowDrafts,
        searchQuery,
        selectedTag,
      }),
    [effectiveShowDrafts, searchQuery, selectedTag, visiblePosts]
  )
  const searchSuggestions = useMemo(
    () => getPostSearchSuggestions(allTags, allSeries, searchQuery).slice(0, 6),
    [allSeries, allTags, searchQuery]
  )
  const normalizedSearchQuery = searchQuery.trim()
  const visibleRecentSearches = recentSearches
    .filter((item) => item.toLowerCase() !== normalizedSearchQuery.toLowerCase())
    .slice(0, 5)
  const showSearchSuggestions = isSearchFocused && (normalizedSearchQuery.length > 0 || visibleRecentSearches.length > 0)
  const searchPageHref = (() => {
    if (!normalizedSearchQuery) return "/search"
    const params = new URLSearchParams()
    params.set("q", normalizedSearchQuery)
    if (selectedTag) params.set("tag", selectedTag)
    return `/search?${params.toString()}`
  })()

  const showFeaturedSection = !searchQuery && selectedTag === null && currentPage === 1
  const featuredPosts = showFeaturedSection
    ? filteredPosts.filter((post) => post.featured && !post.draft).slice(0, 3)
    : []
  const featuredIds = new Set(featuredPosts.map((post) => post.id))
  const listSourcePosts = showFeaturedSection
    ? filteredPosts.filter((post) => !featuredIds.has(post.id))
    : filteredPosts

  const totalPages = Math.max(1, Math.ceil(listSourcePosts.length / postsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedPosts = listSourcePosts.slice((safeCurrentPage - 1) * postsPerPage, safeCurrentPage * postsPerPage)
  const playModeLabel = playMode === "loop" ? "列表循环" : playMode === "repeat-one" ? "单曲循环" : "随机播放"

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const nextParams = new URLSearchParams()
    const normalizedQuery = searchQuery.trim()

    if (normalizedQuery) nextParams.set("q", normalizedQuery)
    if (selectedTag) nextParams.set("tag", selectedTag)
    if (safeCurrentPage > 1) nextParams.set("page", String(safeCurrentPage))
    if (effectiveShowDrafts) nextParams.set("drafts", "1")

    const currentParams = new URLSearchParams(window.location.search)
    currentParams.delete("login")
    currentParams.delete("next")

    const currentNormalized = currentParams.toString()
    const nextNormalized = nextParams.toString()

    if (currentNormalized === nextNormalized) {
      return
    }

    const nextUrl = nextNormalized ? `${window.location.pathname}?${nextNormalized}` : window.location.pathname
    window.history.replaceState(null, "", nextUrl)
  }, [effectiveShowDrafts, safeCurrentPage, searchQuery, selectedTag])

  const applySearchQuery = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
    const normalizedValue = value.trim()
    if (!normalizedValue) return
    setRecentSearches(pushRecentSearch(normalizedValue))
  }

  return (
    <div className="min-h-screen text-foreground">
      {/* Navigation */}
      <nav className="apple-nav sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SiteBrand label={siteSettings.brandName} className="text-foreground" />
            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4 lg:flex-nowrap lg:justify-end lg:gap-3">
              <div className="relative min-w-0 w-full sm:w-auto lg:w-[12rem] xl:w-[13rem] 2xl:w-auto">
                <SearchQueryInput
                  placeholder="搜索文章或标签..."
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 120)}
                  onChange={(event) => {
                    applySearchQuery(event.target.value)
                  }}
                  className="relative"
                  inputClassName="apple-input w-full pl-9 pr-9"
                  showClearButton={Boolean(searchQuery || selectedTag)}
                  onClear={() => {
                    setSearchQuery("")
                    setSelectedTag(null)
                    setCurrentPage(1)
                  }}
                />
                {showSearchSuggestions ? (
                  <div className="apple-panel absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-[1.4rem] p-2 shadow-2xl">
                    <div className="space-y-1">
                      {visibleRecentSearches.map((recentSearch) => (
                        <button
                          key={`recent-${recentSearch}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            applySearchQuery(recentSearch)
                            setSelectedTag(null)
                            setIsSearchFocused(false)
                          }}
                          className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                        >
                          <span className="truncate">{recentSearch}</span>
                          <span className="ml-3 shrink-0 text-[11px] text-muted-foreground">最近搜索</span>
                        </button>
                      ))}
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.type}-${suggestion.value}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            if (suggestion.type === "tag") {
                              setSelectedTag(suggestion.value)
                              setSearchQuery("")
                            } else {
                              applySearchQuery(suggestion.value)
                              setSelectedTag(null)
                            }
                            setIsSearchFocused(false)
                          }}
                          className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                        >
                          <span className="truncate">
                            {suggestion.type === "tag" ? "#" : "系列："}
                            <HighlightedText text={suggestion.value} query={searchQuery} />
                          </span>
                          <span className="ml-3 shrink-0 text-[11px] text-muted-foreground">
                            {suggestion.type === "tag" ? "标签" : "系列"}
                          </span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setIsSearchFocused(false)
                          router.push(searchPageHref)
                        }}
                        className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <span className="truncate">
                          在搜索页查看 “<HighlightedText text={normalizedSearchQuery} query={searchQuery} />”
                        </span>
                        <span className="ml-3 shrink-0 text-[11px] text-muted-foreground">
                          全部结果
                        </span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground hidden xl:inline">
                共 {filteredPosts.length} 篇
              </span>
              <PrimaryNavLinks
                active="home"
                loginRequested={loginRequested}
                nextPath={nextPath}
                onDismissLoginRequest={() => router.replace("/home")}
              />
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setShowDrafts(!showDrafts)
                    setCurrentPage(1)
                  }}
                  className={`apple-button-secondary min-w-[4.8rem] px-3 py-1.5 ${effectiveShowDrafts ? "bg-white text-foreground dark:bg-white/12" : ""}`}
                >
                  <span className="2xl:hidden">{effectiveShowDrafts ? "草稿开" : "草稿关"}</span>
                  <span className="hidden 2xl:inline">{effectiveShowDrafts ? '隐藏草稿' : '显示草稿'}</span>
                </button>
              ) : null}
            </div>
            {selectedTag ? (
              <div className="lg:hidden">
                <span className="apple-pill">#{selectedTag}</span>
              </div>
            ) : null}
          </div>
          {selectedTag ? (
            <div className="mt-3 hidden lg:block">
              <span className="apple-pill">#{selectedTag}</span>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <section className="pb-3 pt-3 sm:pb-4 sm:pt-4">
          <div className="apple-panel flex flex-col gap-4 rounded-[2rem] px-5 py-5 sm:px-6 sm:py-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 lg:max-w-none">
              <span className="section-kicker">{siteSettings.homeKicker}</span>
              <h1 className="mt-3 max-w-[16.5ch] text-balance text-[2.1rem] leading-[0.96] font-semibold tracking-[-0.07em] text-foreground sm:max-w-[15.5ch] sm:text-[2.7rem] lg:max-w-[18ch] lg:text-[3rem]">
                {renderHomeTitle(siteSettings.homeTitle)}
              </h1>
              <p className="section-copy mt-3 max-w-2xl">
                {siteSettings.homeDescription}
              </p>
              <div className="mt-4 grid max-w-md grid-cols-3 gap-3 sm:flex sm:max-w-none sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-2">
                <StatItem value={filteredPosts.length} label="篇文章" />
                <StatItem value={allTags.length} label="个标签" />
                <StatItem value={playlist.length} label="首音乐" />
              </div>
            </div>
            <div className="self-center lg:max-w-[220px] lg:-translate-x-6 lg:-translate-y-2">
              <PaletteHeroTrio />
            </div>
          </div>
        </section>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col gap-6 pb-24 lg:flex-row lg:gap-10">
          {/* Blog Posts */}
          <main className="flex-1 space-y-5">
            {featuredPosts.length > 0 ? (
              <section className="mb-8">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="section-kicker">Featured Stories</p>
                    <h2 className="section-title mt-2">精选内容</h2>
                  </div>
                  <Link href="/series" className="hidden text-sm text-muted-foreground transition-colors hover:text-primary sm:block">
                    浏览全部系列
                  </Link>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  {featuredPosts.map((post) => (
                    <FeaturedStoryCard key={post.id} post={post} isAuthenticated={isAuthenticated} searchQuery={searchQuery} />
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mb-2 flex items-end justify-between">
              <div>
                <p className="section-kicker">Latest Writing</p>
                <h2 className="section-title mt-2">最近更新</h2>
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
                  searchQuery={searchQuery}
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
            <SidebarSection title="最新文章">
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
            </SidebarSection>

            {/* Latest Comments */}
            {recentComments.length > 0 && (
              <SidebarSection title="最新评论">
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
              </SidebarSection>
            )}

            {/* Tags */}
            <SidebarSection title="标签">
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
            </SidebarSection>
            </div>
          </aside>
        </div>
      </div>
      {/* Footer */}
      <SiteFooter
        text={siteSettings.footerText}
        innerClassName="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground"
      />

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`brand-solid-button fixed bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full text-lg transition-all duration-300 ${
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        } right-[84px] sm:right-6 ${floatingHovering ? "lg:right-[20rem]" : "lg:right-[80px]"}`}
        aria-label="回到顶部"
      >
        ↑
      </button>
    </div>
  )
}
