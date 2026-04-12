"use client"
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import type { MusicTrack } from "@/app/api/music/route"

interface LocalDraft {
  title: string
  excerpt: string
  content: string
  category: string
  tags: string
  coverImage: string
  bgmSrc: string
  pinned: boolean
  draft: boolean
  savedAt: string
}

function readLocalDraft(storageKey: string) {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as LocalDraft) : null
  } catch {
    return null
  }
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const draftStorageKey = `champion-blog:edit-post:${id}`
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStatus()
  const [localDraft, setLocalDraft] = useState<LocalDraft | null>(() => readLocalDraft(draftStorageKey))

  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("随笔")
  const [tags, setTags] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [bgmSrc, setBgmSrc] = useState("")
  const [pinned, setPinned] = useState(false)
  const [draft, setDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit")
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [savedAt, setSavedAt] = useState<string | null>(localDraft?.savedAt ?? null)
  const [availableTracks, setAvailableTracks] = useState<MusicTrack[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (!isAuthenticated) {
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
        setCoverImage(post.coverImage || "")
        setBgmSrc(post.bgmSrc || "")
        setPinned(post.pinned || false)
        setDraft(post.draft || false)
        setLoading(false)
      })
      .catch(() => {
        setMessage("加载失败")
        setLoading(false)
      })
  }, [id, isAuthenticated, isAuthLoading, router])

  const clearSavedDraft = useCallback(() => {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(draftStorageKey)
    setLocalDraft(null)
    setSavedAt(null)
  }, [draftStorageKey])

  const restoreLocalDraft = useCallback(() => {
    if (!localDraft) return
    setTitle(localDraft.title)
    setExcerpt(localDraft.excerpt)
    setContent(localDraft.content)
    setCategory(localDraft.category)
    setTags(localDraft.tags)
    setCoverImage(localDraft.coverImage)
    setBgmSrc(localDraft.bgmSrc)
    setPinned(localDraft.pinned)
    setDraft(localDraft.draft)
    setSavedAt(localDraft.savedAt)
  }, [localDraft])

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || loading) return

    const timeoutId = window.setTimeout(() => {
      const nextSavedAt = new Date().toISOString()
      const payload: LocalDraft = {
        title,
        excerpt,
        content,
        category,
        tags,
        coverImage,
        bgmSrc,
        pinned,
        draft,
        savedAt: nextSavedAt,
      }

      try {
        window.localStorage.setItem(draftStorageKey, JSON.stringify(payload))
        setSavedAt(nextSavedAt)
      } catch {}
    }, 600)

    return () => window.clearTimeout(timeoutId)
  }, [bgmSrc, category, content, coverImage, draft, draftStorageKey, excerpt, isAuthenticated, isAuthLoading, loading, pinned, tags, title])

  useEffect(() => {
    fetch("/api/music", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAvailableTracks(Array.isArray(data.tracks) ? data.tracks : []))
      .catch(() => setAvailableTracks([]))
  }, [])

  const insertTextAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)
    setContent(before + text + after)

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

  const insertFormat = (before: string, after: string = before) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const newText = `${before}${selected || '文字'}${after}`
    insertTextAtCursor(newText)
  }

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
          coverImage,
          bgmSrc,
          pinned,
          draft: publishDraft,
        }),
      })

      if (res.ok) {
        clearSavedDraft()
        setMessage(publishDraft ? "草稿已保存！" : "文章已更新！")
        if (!publishDraft) {
          setDraft(false)
        }
        setTimeout(() => router.push('/home'), 1000)
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
        router.push('/home')
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
              <Link href="/home" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                ← 返回
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">编辑文章</h1>
          <p className="text-muted-foreground">修改你的内容 · 支持上传/粘贴图片</p>
          {savedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              本地草稿最近保存于 {new Date(savedAt).toLocaleString("zh-CN")}
            </p>
          )}
          {localDraft && (
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">检测到未提交的本地草稿。</span>
              <button type="button" onClick={restoreLocalDraft} className="text-primary hover:underline">
                恢复草稿
              </button>
              <button type="button" onClick={clearSavedDraft} className="text-muted-foreground hover:text-foreground transition-colors">
                清除
              </button>
            </div>
          )}
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

          {/* Content */}
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
                  placeholder={"写下你的内容...\n\n💡 提示：\n- 选中文字后点击工具栏按钮可快速格式化\n- 直接 Ctrl/Cmd+V 粘贴图片\n- 点击 📁上传 或 🖼️链接 按钮插入图片"}
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

          {/* Hidden file input */}
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
        </div>
      </div>
    </div>
  )
}
