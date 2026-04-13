"use client"
/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useMusic } from "@/context/MusicContext"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Post, TocItem } from "@/lib/posts"
import LoginModal from "@/components/LoginModal"
import Comments from "@/components/Comments"
import hljs from "highlight.js"
import { useAuthStatus } from "@/hooks/useAuthStatus"

import "highlight.js/styles/github-dark.css"

interface PostClientProps {
  post: Post
  content: string
  readingTime: number
  headings: TocItem[]
  relatedPosts: Post[]
  previousPost?: Post
  nextPost?: Post
}

export default function PostClient({ post, content, readingTime, headings, relatedPosts, previousPost, nextPost }: PostClientProps) {
  const router = useRouter()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [views, setViews] = useState(post.views || 0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const articleRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { isHovering, playTrackBySrc, track } = useMusic()
  const { isAuthenticated, logout } = useAuthStatus()

  // Back to top & code highlight
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)

      const article = articleRef.current
      if (!article) return

      const rect = article.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const startOffset = 120
      const visibleProgressStart = Math.max(0, startOffset - rect.top)
      const trackableHeight = Math.max(1, article.offsetHeight - viewportHeight + 220)
      const nextProgress = Math.max(0, Math.min(100, (visibleProgressStart / trackableHeight) * 100))
      setReadingProgress(nextProgress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Code syntax highlighting
  useEffect(() => {
    if (!contentRef.current) return
    contentRef.current.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block as HTMLElement)
    })
  }, [content])

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return
    }

    // 异步增加访问量
    fetch(`/api/posts/${post.id}/views`, { method: 'POST' })
      .then(r => r.json())
      .then(data => { if (data.views) setViews(data.views) })
      .catch(() => {})
  }, [post.id])

  const handleLogout = () => {
    logout()
    router.push('/home');
  };

  const handleTogglePin = async () => {
    try {
      await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !post.pinned }),
      })
      router.refresh()
    } catch {}
  };
  return (
    <div className="min-h-screen text-foreground">
      {/* Navigation */}
      <nav className="apple-nav sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#5a4030] text-sm font-semibold text-white shadow-lg shadow-amber-900/10 dark:bg-[#f5e9dc] dark:text-[#35261d]">
                <span className="text-sm font-bold text-current">C</span>
              </div>
              <span className="text-lg font-semibold tracking-[-0.03em]">Champion&apos;s Blog</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
                  <button
                    onClick={() => router.push(`/write/${post.id}`)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/70"
                  >
                    编辑
                  </button>
                  <button
                    onClick={handleTogglePin}
                    className={`text-sm font-medium transition-colors ${post.pinned ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'}`}
                  >
                    {post.pinned ? '取消置顶' : '置顶'}
                  </button>
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
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                  >
                    退出
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="apple-button-secondary"
                >
                  管理
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="h-0.5 bg-secondary/70">
          <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${readingProgress}%` }} />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        {/* Back link */}
        <Link href="/home" className="apple-pill mb-8 inline-flex items-center gap-2 hover:bg-white dark:hover:bg-white/12">
          ← 返回首页
        </Link>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Article */}
            <article ref={articleRef} className="apple-panel rounded-[2.25rem] p-6 sm:p-10">
              <header className="mb-8">
                {post.coverImage && (
                  <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/70 dark:border-white/10">
                    <img src={post.coverImage} alt={post.title} className="h-60 w-full object-cover sm:h-[25rem]" />
                  </div>
                )}
                <div className="mb-5 flex flex-wrap items-center gap-2.5">
                  <span className="apple-pill">
                    {post.category}
                  </span>
                  <span className="text-sm text-muted-foreground">{post.date}</span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{readingTime} 分钟阅读</span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{views} 次阅读</span>
                  <div className="ml-auto flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <Link
                        key={tag}
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="apple-pill hover:bg-white dark:hover:bg-white/12"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
                <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">{post.title}</h1>
                {post.bgmSrc && (
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => playTrackBySrc(post.bgmSrc)}
                      className="rounded-full bg-[#5a4030] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6a4c39] dark:bg-[#f5e9dc] dark:text-[#35261d] dark:hover:bg-[#fff6ee]"
                    >
                      {track.src === post.bgmSrc ? "播放本文 BGM 中" : "播放本文 BGM"}
                    </button>
                    <span className="text-sm text-muted-foreground">这篇文章绑定了一首专属背景音乐</span>
                  </div>
                )}
              </header>

              <div
                ref={contentRef}
                className="post-content prose prose-lg prose-neutral max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </article>

            {(previousPost || nextPost) && (
              <section className="mt-8 grid gap-4 md:grid-cols-2">
                {previousPost ? (
                  <Link
                    href={`/posts/${previousPost.slug || previousPost.id}`}
                    className="apple-panel-soft rounded-[1.75rem] p-5 transition-all hover:-translate-y-0.5"
                  >
                    <p className="text-xs text-muted-foreground">上一篇</p>
                    <h3 className="mt-2 text-base font-semibold">{previousPost.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{previousPost.excerpt}</p>
                  </Link>
                ) : (
                  <div className="hidden md:block" />
                )}

                {nextPost ? (
                  <Link
                    href={`/posts/${nextPost.slug || nextPost.id}`}
                    className="apple-panel-soft rounded-[1.75rem] p-5 text-left transition-all hover:-translate-y-0.5"
                  >
                    <p className="text-xs text-muted-foreground">下一篇</p>
                    <h3 className="mt-2 text-base font-semibold">{nextPost.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{nextPost.excerpt}</p>
                  </Link>
                ) : null}
              </section>
            )}

            {/* Comments */}
            <div className="mt-8">
              <Comments post={post} />
            </div>
          </div>

          {/* Sidebar */}
          {(headings.length > 0 || relatedPosts.length > 0) && (
            <aside className="w-full flex-shrink-0 lg:sticky lg:top-24 lg:w-72">
              <div className="space-y-6">
                <div className="apple-panel-soft rounded-[1.75rem] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">文章信息</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>发布时间：{post.date}</p>
                    <p>阅读时长：{readingTime} 分钟</p>
                    <p>浏览次数：{views}</p>
                    <p>分类：{post.category}</p>
                  </div>
                  {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/tags/${encodeURIComponent(tag)}`}
                          className="apple-pill hover:bg-white dark:hover:bg-white/12"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {headings.length > 0 && (
                  <div className="apple-panel-soft rounded-[1.75rem] p-5">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">目录</h3>
                    <nav className="space-y-1.5">
                      {headings.map((heading) => (
                        <a
                          key={heading.id}
                          href={`#${heading.id}`}
                          className={`block text-sm text-muted-foreground transition-colors hover:text-primary ${
                            heading.level === 3 ? "pl-4" : ""
                          }`}
                        >
                          {heading.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}

                {relatedPosts.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground">相关文章</h3>
                    <div className="space-y-3">
                      {relatedPosts.map(rp => (
                        <Link
                          key={rp.id}
                          href={`/posts/${rp.slug || rp.id}`}
                          className="apple-panel-soft block rounded-[1.5rem] p-4 transition-all hover:-translate-y-0.5"
                        >
                          <span className="apple-pill mb-2 inline-flex">
                            {rp.category}
                          </span>
                          <h4 className="line-clamp-2 text-sm font-semibold transition-colors hover:text-primary">
                            {rp.title}
                          </h4>
                          <p className="mt-1 text-xs text-muted-foreground">{rp.date}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`apple-panel fixed bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full text-lg text-foreground transition-all duration-300 hover:bg-white dark:hover:bg-white/12 ${
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        } ${isHovering ? "right-[17rem]" : "right-[80px]"}`}
        aria-label="回到顶部"
      >
        ↑
      </button>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {}}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-white/60 py-10 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Champion&apos;s Blog
        </div>
      </footer>
    </div>
  )
}
