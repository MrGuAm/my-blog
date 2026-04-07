"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Post } from "@/lib/posts"

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("随笔")
  const [tags, setTags] = useState("")
  const [pinned, setPinned] = useState(false)
  const [draft, setDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!document.cookie.includes('authenticated=')) {
      router.push('/login')
      return
    }
    fetch(`/api/posts/${id}`)
      .then(r => r.json())
      .then(post => {
        setTitle(post.title || "")
        setExcerpt(post.excerpt || "")
        setContent(post.content || "")
        setCategory(post.category || "随笔")
        setTags((post.tags || []).join(", "))
        setPinned(post.pinned || false)
        setDraft(post.draft || false)
        setLoading(false)
      })
      .catch(() => {
        setMessage("加载失败")
        setLoading(false)
      })
  }, [id, router])

  const handleSave = async (publishDraft: boolean) => {
    if (!title || !content) {
      setMessage("标题和内容不能为空")
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt,
          content,
          category,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          pinned,
          draft: publishDraft,
        }),
      })

      if (res.ok) {
        setMessage(publishDraft ? "草稿已保存！" : "文章已更新！")
        if (!publishDraft) {
          setDraft(false)
        }
        setTimeout(() => router.push('/'), 1000)
      } else {
        const data = await res.json()
        setMessage(data.error || "保存失败")
      }
    } catch {
      setMessage("网络错误")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇文章吗？")) return

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        router.push('/')
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

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
              <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                ← 返回
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">编辑文章</h1>
          <p className="text-muted-foreground">修改你的内容</p>
        </div>

        <div className="space-y-6">
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

          {/* Pin & Draft toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">置顶文章</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft}
                onChange={(e) => setDraft(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">存为草稿</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "保存中..." : "保存"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl border border-border/60 bg-card text-foreground font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              保存草稿
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-3 rounded-xl border border-red-500/50 text-red-500 font-medium hover:bg-red-500/10 transition-colors"
            >
              删除文章
            </button>
            {message && (
              <span className={message.includes("成功") || message.includes("已更新") ? "text-green-500" : "text-red-500"}>
                {message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
