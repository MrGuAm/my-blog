"use client"
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import type { MusicTrack } from "@/app/api/music/route"
import type { Post } from "@/lib/posts"

interface LocalDraft {
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string
  coverImage: string
  bgmSrc: string
  pinned: boolean
  savedAt: string
}

const draftStorageKey = "champion-blog:new-post-draft"

function readLocalDraft() {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(draftStorageKey)
    return raw ? (JSON.parse(raw) as LocalDraft) : null
  } catch {
    return null
  }
}

function readReturnPath() {
  if (typeof window === "undefined") return "/home"
  const params = new URLSearchParams(window.location.search)
  const from = params.get("from")
  if (from && from.startsWith("/") && !from.startsWith("//")) return from
  return "/home"
}

export default function WritePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuthStatus()
  const [returnPath] = useState(() => readReturnPath())
  const initialDraft = readLocalDraft()
  const [title, setTitle] = useState(initialDraft?.title ?? "")
  const [slug, setSlug] = useState(initialDraft?.slug ?? "")
  const [excerpt, setExcerpt] = useState(initialDraft?.excerpt ?? "")
  const [content, setContent] = useState(initialDraft?.content ?? "")
  const [category, setCategory] = useState(initialDraft?.category ?? "随笔")
  const [tags, setTags] = useState(initialDraft?.tags ?? "")
  const [coverImage, setCoverImage] = useState(initialDraft?.coverImage ?? "")
  const [bgmSrc, setBgmSrc] = useState(initialDraft?.bgmSrc ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [pinned, setPinned] = useState(initialDraft?.pinned ?? false)
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit")
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [savedAt, setSavedAt] = useState<string | null>(initialDraft?.savedAt ?? null)
  const [availableTracks, setAvailableTracks] = useState<MusicTrack[]>([])
  const [dashboardPosts, setDashboardPosts] = useState<Post[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(`/home?login=1&next=${encodeURIComponent(`/write?from=${returnPath}`)}`)
    }
  }, [isAuthenticated, isAuthLoading, returnPath, router])

  const handleLogout = () => {
   logout()
   router.push('/home');
 };

  const clearSavedDraft = useCallback(() => {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(draftStorageKey)
    setSavedAt(null)
  }, [])

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return

    const timeoutId = window.setTimeout(() => {
      const nextSavedAt = new Date().toISOString()
      const payload: LocalDraft = {
        slug,
        title,
        excerpt,
        content,
        category,
        tags,
        coverImage,
        bgmSrc,
        pinned,
        savedAt: nextSavedAt,
      }

      try {
        window.localStorage.setItem(draftStorageKey, JSON.stringify(payload))
        setSavedAt(nextSavedAt)
      } catch {}
    }, 600)

    return () => window.clearTimeout(timeoutId)
  }, [bgmSrc, category, content, coverImage, excerpt, isAuthenticated, isAuthLoading, pinned, slug, tags, title])

  useEffect(() => {
    if (!title.trim()) return
    setSlug((current) => current || title.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, ""))
  }, [title])

  useEffect(() => {
    fetch("/api/music", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAvailableTracks(Array.isArray(data.tracks) ? data.tracks : []))
      .catch(() => setAvailableTracks([]))
  }, [])

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return
    fetch("/api/posts", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setDashboardPosts(Array.isArray(data) ? data : []))
      .catch(() => setDashboardPosts([]))
  }, [isAuthenticated, isAuthLoading])

  const insertTextAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)
    setContent(before + text + after)

    // Move cursor after the inserted text
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length
      textarea.focus()
    })
  }, [content])

  // Handle paste - image as base64
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type === "image/heic" || item.type === "image/heif" || item.type.startsWith("image/")) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file) return

          const processFile = async (f: File) => {
            let blob: Blob = f
            if (f.type === "image/heic" || f.type === "image/heif") {
              const heic = (await import("heic2any")).default
              blob = (await heic({ blob: f, toType: "image/jpeg", quality: 0.85 })) as Blob
            }
            const reader = new FileReader()
            reader.onload = (ev) => {
              const base64 = ev.target?.result as string
              const imgTag = `\n<img src="${base64}" alt="图片" style="max-width:100%;border-radius:8px;margin:16px 0;" />\n`
              insertTextAtCursor(imgTag)
            }
            reader.readAsDataURL(blob)
          }

          processFile(file)
          return
        }
      }
    }

    textarea.addEventListener('paste', handlePaste)
    return () => textarea.removeEventListener('paste', handlePaste)
  }, [insertTextAtCursor])

  const handleInsertImage = () => {
    if (!imageUrl.trim()) return
    const imgTag = `\n<img src="${imageUrl}" alt="图片" style="max-width:100%;border-radius:8px;margin:16px 0;" />\n`
    insertTextAtCursor(imgTag)
    setImageUrl("")
    setImageDialogOpen(false)
  }

  // Toolbar insert helpers
  const insertFormat = (before: string, after: string = before) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const newText = `${before}${selected || '文字'}${after}`
    insertTextAtCursor(newText)
  }

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
          slug,
          excerpt,
          content,
          category,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          coverImage,
          bgmSrc,
          pinned,
        }),
      })

      if (res.ok) {
        clearSavedDraft()
        setMessage("发布成功！")
        setTimeout(() => router.push(returnPath), 1000)
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

  const draftPosts = dashboardPosts.filter((post) => post.draft)
  const recentEditedPosts = [...dashboardPosts]
    .sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime())
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#6C3FF5]/60 flex items-center justify-center">
                <span className="text-white text-sm font-bold">C</span>
              </div>
              <span className="font-black text-lg">Champion&apos;s Blog</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href={returnPath} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                ← 返回
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

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">写文章</h1>
          <p className="text-muted-foreground">记录你的想法 · 支持直接粘贴图片</p>
          {savedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              草稿已自动保存在本地 · 最近一次保存 {new Date(savedAt).toLocaleString("zh-CN")}
            </p>
          )}
        </div>

        {(draftPosts.length > 0 || recentEditedPosts.length > 0) && (
          <div className="mb-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">草稿箱</h2>
                <span className="text-xs text-muted-foreground">{draftPosts.length} 篇</span>
              </div>
              <div className="space-y-2">
                {draftPosts.length > 0 ? draftPosts.slice(0, 4).map((post) => (
                  <Link
                    key={post.id}
                    href={`/write/${post.id}`}
                    className="block rounded-xl border border-border/40 px-3 py-2 hover:border-primary/40 hover:bg-accent/20 transition-colors"
                  >
                    <p className="text-sm font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">最近更新 {new Date(post.updatedAt || post.date).toLocaleString("zh-CN")}</p>
                  </Link>
                )) : (
                  <p className="text-sm text-muted-foreground">现在没有草稿，可以放心开写。</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">最近编辑</h2>
                <span className="text-xs text-muted-foreground">继续写作更方便</span>
              </div>
              <div className="space-y-2">
                {recentEditedPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={post.draft ? `/write/${post.id}` : `/posts/${post.slug || post.id}`}
                    className="block rounded-xl border border-border/40 px-3 py-2 hover:border-primary/40 hover:bg-accent/20 transition-colors"
                  >
                    <p className="text-sm font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.draft ? "草稿" : "已发布"} · {new Date(post.updatedAt || post.date).toLocaleString("zh-CN")}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

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

          <div>
            <label className="block text-sm font-medium mb-2">文章短链接 slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-first-post"
              className="w-full px-4 py-3 rounded-xl border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <p className="mt-2 text-xs text-muted-foreground">会根据标题自动生成，也可以自己改，适合做更清晰的文章地址。</p>
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
          <div className="grid gap-4 md:grid-cols-2">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">封面图（可选）</label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="w-full px-4 py-3 rounded-xl border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">文章 BGM（可选）</label>
              <select
                value={bgmSrc}
                onChange={(e) => setBgmSrc(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="">不绑定</option>
                {availableTracks.map((song) => (
                  <option key={song.src} value={song.src}>
                    {song.artist} - {song.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content Toolbar */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium">内容</label>
              <div className="inline-flex rounded-full border border-border/50 bg-card p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setPreviewMode("edit")}
                  className={`rounded-full px-3 py-1 transition-colors ${previewMode === "edit" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("preview")}
                  className={`rounded-full px-3 py-1 transition-colors ${previewMode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  预览
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-border/40 bg-secondary/20 flex-wrap">
                <button type="button" onClick={() => insertFormat('<strong>', '</strong>')} className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors font-bold" title="加粗">B</button>
                <button type="button" onClick={() => insertFormat('<em>', '</em>')} className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors italic" title="斜体">I</button>
                <button type="button" onClick={() => insertFormat('<h2>', '</h2>')} className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors font-bold" title="二级标题">H2</button>
                <button type="button" onClick={() => insertFormat('<h3>', '</h3>')} className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors font-bold" title="三级标题">H3</button>
                <div className="w-px h-5 bg-border/40 mx-1" />
                <button type="button" onClick={() => insertFormat('<pre><code>', '</code></pre>')} className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors font-mono" title="代码块">{"</>"}</button>
                <button type="button" onClick={() => insertFormat('<code>', '</code>')} className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors font-mono" title="行内代码">`</button>
                <div className="w-px h-5 bg-border/40 mx-1" />
                <button type="button" onClick={() => insertFormat('<a href="">', '</a>')} className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors" title="链接">🔗</button>
                <button type="button" onClick={() => insertFormat('<blockquote>', '</blockquote>')} className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors" title="引用">❝</button>
                <button type="button" onClick={() => insertFormat('<ul><li>', '</li></ul>')} className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors" title="无序列表">•</button>
                <div className="w-px h-5 bg-border/40 mx-1" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors flex items-center gap-1"
                  title="上传本地图片"
                >
                  📁 上传
                </button>
                <button
                  type="button"
                  onClick={() => setImageDialogOpen(true)}
                  className="px-2 py-1 text-sm rounded hover:bg-secondary transition-colors flex items-center gap-1"
                  title="输入图片链接"
                >
                  🖼️ 链接
                </button>
                <span className="text-xs text-muted-foreground ml-2">· 支持拖拽 / Ctrl+V 粘贴 / 📁上传</span>
              </div>

              {/* Textarea */}
              {previewMode === "edit" ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"写下你的内容...\n\n💡 提示：\n- 选中文字后点击工具栏按钮可快速格式化\n- 直接 Ctrl/Cmd+V 粘贴图片\n- 点击 🖼️ 图片 按钮输入图片链接"}
                  rows={15}
                  className="w-full px-4 py-3 bg-transparent focus:outline-none transition-all resize-none text-sm leading-relaxed"
                />
              ) : (
                <div className="min-h-[24rem] space-y-5 px-4 py-4">
                  {coverImage && (
                    <div className="overflow-hidden rounded-xl border border-border/40">
                      <img src={coverImage} alt={title || "文章封面"} className="h-56 w-full object-cover" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-black">{title || "未命名文章"}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{excerpt || "这里会显示文章摘要。"}</p>
                    {bgmSrc && (
                      <p className="mt-3 inline-flex rounded-full bg-[#FF9B6B]/15 px-3 py-1 text-xs text-[#FF9B6B]">
                        这篇文章已绑定 BGM
                      </p>
                    )}
                  </div>
                  <div className="prose prose-lg max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: content || "<p>预览内容会显示在这里。</p>" }} />
                </div>
              )}
            </div>
          </div>

          {/* Hidden file input for local image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                let blob: Blob = file
                // Convert HEIC to JPEG if needed
                if (file.type === "image/heic" || file.type === "image/heif") {
                  const heic = (await import("heic2any")).default
                  blob = (await heic({ blob: file, toType: "image/jpeg", quality: 0.85 })) as Blob
                }
                const reader = new FileReader()
                reader.onload = (ev) => {
                  const base64 = ev.target?.result as string
                  const imgTag = `\n<img src="${base64}" alt="${file.name}" style="max-width:100%;border-radius:8px;margin:16px 0;" />\n`
                  insertTextAtCursor(imgTag)
                }
                reader.readAsDataURL(blob)
              } catch {
                // Fallback: try reading as-is
                const reader = new FileReader()
                reader.onload = (ev) => {
                  const base64 = ev.target?.result as string
                  const imgTag = `\n<img src="${base64}" alt="${file.name}" style="max-width:100%;border-radius:8px;margin:16px 0;" />\n`
                  insertTextAtCursor(imgTag)
                }
                reader.readAsDataURL(file)
              }
              e.target.value = ''
            }}
          />

          {/* Image URL Dialog */}
          {imageDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setImageDialogOpen(false)}>
              <div className="bg-card rounded-xl border border-border/60 p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">插入图片链接</h3>
                <p className="text-sm text-muted-foreground mb-2">输入图片网络链接</p>
                <p className="text-xs text-muted-foreground mb-4">也可以直接点击工具栏 📁上传 按钮选择本地文件</p>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleInsertImage()}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleInsertImage}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    插入
                  </button>
                  <button
                    onClick={() => setImageDialogOpen(false)}
                    className="px-4 py-2 rounded-lg border border-border/60 hover:bg-accent transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pin toggle */}
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">置顶文章</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex flex-wrap items-center gap-4">
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
                  body: JSON.stringify({ title, slug, excerpt, content, category, tags: tags.split(",").map(t => t.trim()).filter(Boolean), coverImage, bgmSrc, draft: true, pinned }),
                })
                  if (res.ok) {
                    clearSavedDraft()
                    setMessage("草稿已保存！")
                    setTimeout(() => router.push("/home"), 1000)
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
            {savedAt && (
              <button
                type="button"
                onClick={clearSavedDraft}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清除本地草稿
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
