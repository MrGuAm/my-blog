"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import PostEditorContentEditor from "@/components/PostEditorContentEditor"
import PostEditorMetaFields from "@/components/PostEditorMetaFields"
import PostEditorPageShell from "@/components/PostEditorPageShell"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import type { MusicTrack } from "@/app/api/music/route"
import type { Post } from "@/lib/posts"
import { buildEditorImageTag, createEditorImageInsertion } from "@/lib/editor-media"

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
  featured: boolean
  series: string
  seriesOrder: string
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

function navigateBack(router: ReturnType<typeof useRouter>, fallbackPath: string) {
  if (typeof window === "undefined") {
    router.push(fallbackPath)
    return
  }

  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push(fallbackPath)
}

function buildSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "")
}

export default function WritePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStatus()
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
  const [featured, setFeatured] = useState(initialDraft?.featured ?? false)
  const [series, setSeries] = useState(initialDraft?.series ?? "")
  const [seriesOrder, setSeriesOrder] = useState(initialDraft?.seriesOrder ?? "")
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit")
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [mediaDialogMode, setMediaDialogMode] = useState<"content" | "cover">("content")
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
        featured,
        series,
        seriesOrder,
        savedAt: nextSavedAt,
      }

      try {
        window.localStorage.setItem(draftStorageKey, JSON.stringify(payload))
        setSavedAt(nextSavedAt)
      } catch {}
    }, 600)

    return () => window.clearTimeout(timeoutId)
  }, [bgmSrc, category, content, coverImage, excerpt, featured, isAuthenticated, isAuthLoading, pinned, series, seriesOrder, slug, tags, title])

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

    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length
      textarea.focus()
    })
  }, [content])

  const handleInsertImageFile = useCallback(async (file: File, alt = file.name || "图片") => {
    try {
      const result = await createEditorImageInsertion(file, alt)
      insertTextAtCursor(result.tag)
      setMessage(result.message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "图片处理失败，请重试")
    }
  }, [insertTextAtCursor])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type === "image/heic" || item.type === "image/heif" || item.type.startsWith("image/")) {
          event.preventDefault()
          const file = item.getAsFile()
          if (!file) return
          void handleInsertImageFile(file, "图片")
          return
        }
      }
    }

    textarea.addEventListener("paste", handlePaste)
    return () => textarea.removeEventListener("paste", handlePaste)
  }, [handleInsertImageFile])

  const handleInsertImage = () => {
    if (!imageUrl.trim()) return
    insertTextAtCursor(buildEditorImageTag(imageUrl))
    setImageUrl("")
    setImageDialogOpen(false)
  }

  const handleUploadAndInsertImage = useCallback(async (file: File) => {
    await handleInsertImageFile(file)
  }, [handleInsertImageFile])

  const insertFormat = (before: string, after: string = before) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const newText = `${before}${selected || "文字"}${after}`
    insertTextAtCursor(newText)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
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
          tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          coverImage,
          bgmSrc,
          pinned,
          featured,
          series,
          seriesOrder: seriesOrder ? Number(seriesOrder) : null,
        }),
      })

      if (res.ok) {
        clearSavedDraft()
        setMessage("发布成功！")
        setTimeout(() => navigateBack(router, returnPath), 1000)
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
    <PostEditorPageShell
      pageTitle="写文章"
      description="记录你的想法 · 支持直接粘贴图片"
      savedAtText={savedAt ? `草稿已自动保存在本地 · 最近一次保存 ${new Date(savedAt).toLocaleString("zh-CN")}` : null}
      onBack={() => navigateBack(router, returnPath)}
      preForm={(draftPosts.length > 0 || recentEditedPosts.length > 0) ? (
        <div className="grid gap-4 lg:grid-cols-2">
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
                  className="block rounded-xl border border-border/40 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/20"
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
                  className="block rounded-xl border border-border/40 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/20"
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
      ) : null}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <PostEditorMetaFields
          title={title}
          slug={slug}
          excerpt={excerpt}
          category={category}
          tags={tags}
          coverImage={coverImage}
          bgmSrc={bgmSrc}
          featured={featured}
          series={series}
          seriesOrder={seriesOrder}
          availableTracks={availableTracks}
          onTitleChange={(nextTitle) => {
            setTitle(nextTitle)
            setSlug((current) => current || buildSlug(nextTitle))
          }}
          onSlugChange={setSlug}
          onExcerptChange={setExcerpt}
          onCategoryChange={setCategory}
          onTagsChange={setTags}
          onCoverImageChange={setCoverImage}
          onBgmSrcChange={setBgmSrc}
          onFeaturedChange={setFeatured}
          onSeriesChange={setSeries}
          onSeriesOrderChange={setSeriesOrder}
          onOpenCoverMediaDialog={() => {
            setMediaDialogMode("cover")
            setMediaDialogOpen(true)
          }}
        />

        <PostEditorContentEditor
          title={title}
          excerpt={excerpt}
          content={content}
          coverImage={coverImage}
          bgmSrc={bgmSrc}
          featured={featured}
          series={series}
          seriesOrder={seriesOrder}
          previewMode={previewMode}
          textareaRef={textareaRef}
          fileInputRef={fileInputRef}
          imageDialogOpen={imageDialogOpen}
          mediaDialogOpen={mediaDialogOpen}
          mediaDialogMode={mediaDialogMode}
          imageUrl={imageUrl}
          onPreviewModeChange={setPreviewMode}
          onContentChange={setContent}
          onLocalImagePick={handleUploadAndInsertImage}
          onImageDialogToggle={setImageDialogOpen}
          onMediaDialogToggle={setMediaDialogOpen}
          onMediaDialogModeChange={setMediaDialogMode}
          onImageUrlChange={setImageUrl}
          onInsertImageUrl={handleInsertImage}
          onInsertFormat={insertFormat}
          onMediaSelect={(url) => {
            if (mediaDialogMode === "cover") {
              setCoverImage(url)
              setMessage("已设为文章封面")
              return
            }
            insertTextAtCursor(buildEditorImageTag(url))
            setMessage("图片已插入正文")
          }}
        />

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm">置顶文章</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
                  body: JSON.stringify({
                    title,
                    slug,
                    excerpt,
                    content,
                    category,
                    tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
                    coverImage,
                    bgmSrc,
                    draft: true,
                    pinned,
                    featured,
                    series,
                    seriesOrder: seriesOrder ? Number(seriesOrder) : null,
                  }),
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
            className="rounded-xl border border-border/60 bg-card px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            保存草稿
          </button>
          {message ? (
            <span className={message.includes("成功") ? "text-green-500" : "text-red-500"}>
              {message}
            </span>
          ) : null}
        </div>
      </form>
    </PostEditorPageShell>
  )
}
