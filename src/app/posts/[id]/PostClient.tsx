"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Post } from "@/lib/posts"

interface PostClientProps {
  post: Post
  content: string
}

export default function PostClient({ post, content }: PostClientProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(mediaQuery.matches)
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
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
              <Link href="/write" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                写文章
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link href="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          ← 返回首页
        </Link>

        {/* Article */}
        <article className="bg-card rounded-xl border border-border/60 p-8">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {post.category}
              </span>
              <span className="text-sm text-muted-foreground">{post.date}</span>
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

          <div
            className="prose prose-lg max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>

        {/* Decorative Line */}
        <div className="flex items-center gap-4 mt-12">
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#6C3FF5] to-[#FF9B6B]" />
          <div className="w-3 h-3 rounded-full bg-[#E8D754]" />
          <div className="w-2 h-2 rounded-full bg-[#2D2D2D]" />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Champion&apos;s Blog
        </div>
      </footer>
    </div>
  )
}
