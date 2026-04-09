"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Post } from "@/lib/posts"
import LoginModal from "@/components/LoginModal"
import { useMusic, musicPlaylist } from "@/context/MusicContext"

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
  if (text.length <= charCount) {
    return <span className="truncate">{text}</span>;
  }

  return (
    <span className="inline-block overflow-hidden">
      <span
        className={`inline-block ${isActive ? 'animate-marquee' : ''}`}
        style={{ whiteSpace: 'nowrap' }}
      >
        {text}
      </span>
    </span>
  );
}
function CharacterEye({ isHovered, containerRef, eyeColor, pupilColor, size }: { isHovered: boolean; containerRef: React.RefObject<HTMLDivElement | null>; eyeColor: string; pupilColor: string; size: number }) {
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
          eyeColor={config.eyeColor}
          pupilColor={config.pupilColor}
          size={config.eyeSize}
        />
        <CharacterEye
          isHovered={isHovered}
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
function PostCard({ post, characterType, onTagClick }: { post: Post; characterType: number; onTagClick: (tag: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);

  const postHref = post.draft && document.cookie.includes('authenticated=') ? `/write/${post.id}` : `/posts/${post.id}`
  return (
    <div
      className="block p-6 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-accent/30 transition-all group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
  const { isPlaying, isHovering: floatingHovering, currentTrack, track, togglePlay, selectTrack, progress, duration, dragProgress, handleMouseDown, handleProgressClick, formatTime } = useMusic()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [localPosts, setLocalPosts] = useState(posts)
  const [showDrafts, setShowDrafts] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [recentComments, setRecentComments] = useState<RecentComment[]>([])
  const [showList, setShowList] = useState(false)
  const [isSidebarHovering, setIsSidebarHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Scroll listener for back to top
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close sidebar playlist when track changes
  useEffect(() => {
    setShowList(false)
  }, [currentTrack])

  // Fetch recent comments
  useEffect(() => {
    fetch('/api/comments')
      .then(r => r.json())
      .then(data => setRecentComments(data.comments || []))
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    document.cookie = 'authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthenticated(false);
    router.push('/home');
  };

  useEffect(() => {
    const auth = document.cookie.includes('authenticated=')
    setIsAuthenticated(auth)
    if (auth) {
      fetch('/api/posts')
        .then(r => r.json())
        .then(apiPosts => setLocalPosts(apiPosts))
        .catch(() => setLocalPosts(posts))
    } else {
      setLocalPosts(posts)
    }
  }, [posts])

  const filteredPosts = localPosts.filter(post =>
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

  return (
    <div className="min-h-screen bg-background">
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
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索文章或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 px-3 py-1.5 pl-8 text-sm bg-secondary/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
                {(searchQuery || selectedTag) && (
                  <button
                    onClick={() => { setSearchQuery(""); setSelectedTag(null); }}
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
              <Link href="/home" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/write"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    写文章
                  </Link>
                  <button
                    onClick={() => setShowDrafts(!showDrafts)}
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

      <div className="max-w-6xl mx-auto px-6">
        {/* Hero Section */}
        <section className="py-16">
          <h1 className="text-4xl font-black tracking-tight mb-4">
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
        <div className="flex gap-8 pb-20">
          {/* Blog Posts */}
          <main className="flex-1 space-y-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post, index) => (
                <PostCard key={post.id} post={post} characterType={index % 4} onTagClick={setSelectedTag} />
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-2">没有找到匹配的文章</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedTag(null); }}
                  className="text-sm text-primary hover:underline"
                >
                  清除筛选
                </button>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0">
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
                    {musicPlaylist.map((song, index) => (
                      <button
                        key={index}
                        onClick={() => { setShowList(false); if (currentTrack !== index) selectTrack(index, false) }}
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
                  onClick={() => { if (!isDragging) setShowList(true) }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#FF9B6B] flex items-center justify-center flex-shrink-0 ${isPlaying ? 'animate-pulse' : ''}`}>
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

                  {/* Progress Bar */}
                  <div
                    className={`transition-all duration-300 ease-out overflow-visible ${isSidebarHovering || isDragging ? 'mt-3 pt-3 border-t border-border/40 opacity-100 max-h-20' : 'mt-0 pt-0 border-t-0 opacity-0 max-h-0'}`}
                  >
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
            <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
              <div className="px-3 pb-3 pt-3">
                <h3 className="text-sm font-semibold mb-2">最新文章</h3>
                <div className="space-y-2">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.slice(0, 3).map((post) => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.id}`}
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
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
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
        onSuccess={() => setIsAuthenticated(true)}
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
