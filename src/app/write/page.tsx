"use client"

import { useState, useEffect, useRef } from "react"
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
  const [pinned, setPinned] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!document.cookie.includes('authenticated=')) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
   document.cookie = 'authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
   router.push('/home');
 };

  // Handle paste - image as base64
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file) return

          const reader = new FileReader()
          reader.onload = (ev) => {
            const base64 = ev.target?.result as string
            const imgTag = `\n<img src="${base64}" alt="图片" style="max-width:100%;border-radius:8px;margin:16px 0;" />\n`
            insertTextAtCursor(imgTag)
          }
          reader.readAsDataURL(file)
          return
        }
      }
    }

    textarea.addEventListener('paste', handlePaste)
    return () => textarea.removeEventListener('paste', handlePaste)
  }, [])

  const insertTextAtCursor = (text: string) => {
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
  }

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
          excerpt,
          content,
          category,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          pinned,
        }),
      })

      if (res.ok) {
        setMessage("发布成功！")
        setTimeout(() => router.push("/home"), 1000)
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

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">写文章</h1>
          <p className="text-muted-foreground">记录你的想法 · 支持直接粘贴图片</p>
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

          {/* Content Toolbar */}
          <div>
            <label className="block text-sm font-medium mb-2">内容</label>
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
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={"写下你的内容...\n\n💡 提示：\n- 选中文字后点击工具栏按钮可快速格式化\n- 直接 Ctrl/Cmd+V 粘贴图片\n- 点击 🖼️ 图片 按钮输入图片链接"}
                rows={15}
                className="w-full px-4 py-3 bg-transparent focus:outline-none transition-all resize-none text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* Hidden file input for local image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = (ev) => {
                const base64 = ev.target?.result as string
                const imgTag = `\n<img src="${base64}" alt="${file.name}" style="max-width:100%;border-radius:8px;margin:16px 0;" />\n`
                insertTextAtCursor(imgTag)
              }
              reader.readAsDataURL(file)
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
                    body: JSON.stringify({ title, excerpt, content, category, tags: tags.split(",").map(t => t.trim()).filter(Boolean), draft: true, pinned }),
                  })
                  if (res.ok) {
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
          </div>
        </form>
      </div>
    </div>
  )
}
