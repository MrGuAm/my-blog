"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function WritePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("随笔")
  const [tags, setTags] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!document.cookie.includes('authenticated=')) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
   document.cookie = 'authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
   router.push('/home');
 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) {
      setMessage("标题和内容不能为空")
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          content,
          category,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      })

      if (res.ok) {
        setMessage("发布成功！")
        setTimeout(() => router.push("/"), 1000)
      } else {
        const data = await res.json()
        setMessage(data.error || "发布失败")
      }
    } catch {
      setMessage("网络错误")
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <Link href="/home" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">写文章</h1>
          <p className="text-muted-foreground">记录你的想法</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
              className="w-full px-4 py-3 rounded-xl border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg font-bold"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium mb-2">摘要（可选）</label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="简单描述一下文章内容..."
              className="w-full px-4 py-3 rounded-xl border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="随笔">随笔</option>
                <option value="技术">技术</option>
                <option value="生活">生活</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">标签（可选，用逗号分隔）</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="React, 前端, 笔记"
                className="w-full px-4 py-3 rounded-xl border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的内容... 支持 HTML 标签如 &lt;strong&gt;, &lt;pre&gt;, &lt;code&gt;"
              rows={15}
              className="w-full px-4 py-3 rounded-xl border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none font-mono text-sm"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "发布中..." : "发布文章"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={async () => {
                setIsSubmitting(true)
                setMessage("")
                try {
                  const res = await fetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, excerpt, content, category, tags: tags.split(",").map(t => t.trim()).filter(Boolean), draft: true }),
                  })
                  if (res.ok) {
                    setMessage("草稿已保存！")
                    setTimeout(() => router.push("/"), 1000)
                  } else {
                    setMessage("保存失败")
                  }
                } catch {
                  setMessage("网络错误")
                } finally {
                  setIsSubmitting(false)
                }
              }}
              className="px-6 py-3 rounded-xl border border-border/60 bg-card text-foreground font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              保存草稿
            </button>
            {message && (
              <span className={message.includes("成功") ? "text-green-500" : "text-red-500"}>
                {message}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
