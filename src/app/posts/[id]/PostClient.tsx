"use client"

import Link from "next/link"
import { useMusic } from "@/context/MusicContext"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Post, TocItem } from "@/lib/posts"
import LoginModal from "@/components/LoginModal"
import Comments from "@/components/Comments"
import hljs from "highlight.js"

import "highlight.js/styles/github-dark.css"

interface PostClientProps {
  post: Post
  content: string
  readingTime: number
  headings: TocItem[]
  relatedPosts: Post[]
}

export default function PostClient({ post, content, readingTime, headings, relatedPosts }: PostClientProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(() => typeof document !== "undefined" && document.cookie.includes("authenticated="))
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [views, setViews] = useState(post.views || 0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const { isHovering } = useMusic()

  // Back to top & code highlight
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener("scroll", handleScroll, { passive: true })
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
    // 异步增加访问量
    fetch(`/api/posts/${post.id}/views`, { method: 'POST' })
      .then(r => r.json())
      .then(data => { if (data.views) setViews(data.views) })
      .catch(() => {})
  }, [post.id])

  const handleLogout = () => {
    document.cookie = 'authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthenticated(false);
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

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link href="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          ← 返回首页
        </Link>

        <div className="flex gap-8 items-start">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Article */}
            <article className="bg-card rounded-xl border border-border/60 p-8">
              <header className="mb-8">
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
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <h1 className="text-3xl font-black tracking-tight">{post.title}</h1>
              </header>

              {/* Table of Contents */}
              {headings.length > 0 && (
                <div className="mb-8 p-4 bg-secondary/30 rounded-xl border border-border/40">
                  <h3 className="text-sm font-semibold mb-3 text-foreground">目录</h3>
                  <nav className="space-y-1">
                    {headings.map(h => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className={`block text-sm text-muted-foreground hover:text-primary transition-colors ${h.level === 3 ? 'pl-4' : ''}`}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              <div
                ref={contentRef}
                className="prose prose-lg max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </article>

            {/* Decorative Line */}
            <div className="flex items-center gap-4 mt-8">
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#6C3FF5] to-[#FF9B6B]" />
              <div className="w-3 h-3 rounded-full bg-[#E8D754]" />
              <div className="w-2 h-2 rounded-full bg-[#2D2D2D]" />
            </div>

            {/* Comments */}
            <div className="mt-8">
              <Comments post={post} />
            </div>
          </div>

          {/* Related Posts Sidebar */}
          {relatedPosts.length > 0 && (
            <aside className="w-full md:w-72 flex-shrink-0 sticky top-24">
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground">相关文章</h3>
              <div className="space-y-3">
                {relatedPosts.map(rp => (
                  <Link
                    key={rp.id}
                    href={`/posts/${rp.id}`}
                    className="block p-3 rounded-xl border border-border/60 bg-card hover:border-primary/50 hover:bg-accent/30 transition-all"
                  >
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mb-2 inline-block">
                      {rp.category}
                    </span>
                    <h4 className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2">
                      {rp.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">{rp.date}</p>
                  </Link>
                ))}
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
        onSuccess={() => setIsAuthenticated(true)}
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
