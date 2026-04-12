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
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
                  <button
                    onClick={() => router.push(`/write/${post.id}`)}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={handleTogglePin}
                    className={`text-sm font-medium transition-colors ${post.pinned ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                  >
                    {post.pinned ? '取消置顶' : '置顶'}
                  </button>
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
        <div className="h-0.5 bg-secondary/70">
          <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${readingProgress}%` }} />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        {/* Back link */}
        <Link href="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          ← 返回首页
        </Link>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Article */}
            <article ref={articleRef} className="bg-card rounded-xl border border-border/60 p-5 sm:p-8">
              <header className="mb-8">
                {post.coverImage && (
                  <div className="mb-6 overflow-hidden rounded-2xl border border-border/50">
                    <img src={post.coverImage} alt={post.title} className="h-52 w-full object-cover sm:h-72" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {post.category}
                  </span>
                  <span className="text-sm text-muted-foreground">{post.date}</span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{readingTime} 分钟阅读</span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{views} 次阅读</span>
                  <div className="flex gap-1.5 ml-auto">
                    {post.tags.map(tag => (
                      <Link
                        key={tag}
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="text-xs px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{post.title}</h1>
                {post.bgmSrc && (
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => playTrackBySrc(post.bgmSrc)}
                      className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      {track.src === post.bgmSrc ? "播放本文 BGM 中" : "播放本文 BGM"}
                    </button>
                    <span className="text-sm text-muted-foreground">这篇文章绑定了一首专属背景音乐</span>
                  </div>
                )}
              </header>

              <div
                ref={contentRef}
                className="post-content prose prose-lg max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </article>

            {/* Decorative Line */}
            <div className="flex items-center gap-4 mt-8">
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#6C3FF5] to-[#FF9B6B]" />
              <div className="w-3 h-3 rounded-full bg-[#E8D754]" />
              <div className="w-2 h-2 rounded-full bg-[#2D2D2D]" />
            </div>

            {(previousPost || nextPost) && (
              <section className="mt-8 grid gap-4 md:grid-cols-2">
                {previousPost ? (
                  <Link
                    href={`/posts/${previousPost.slug || previousPost.id}`}
                    className="rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-primary/50 hover:bg-accent/20"
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
                    className="rounded-2xl border border-border/50 bg-card p-5 text-left transition-all hover:border-primary/50 hover:bg-accent/20"
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
                <div className="rounded-xl border border-border/60 bg-card p-4">
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
                          className="rounded-full bg-secondary/70 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {headings.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-card p-4">
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
                          className="block rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-primary/50 hover:bg-accent/30"
                        >
                          <span className="mb-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
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
        className={`fixed bottom-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center text-lg z-40 ${
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
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Champion&apos;s Blog
        </div>
      </footer>
    </div>
  )
}
