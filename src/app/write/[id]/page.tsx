"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import PostEditorContentEditor from "@/components/PostEditorContentEditor"
import PostEditorMetaFields from "@/components/PostEditorMetaFields"
import PostEditorPageShell from "@/components/PostEditorPageShell"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import type { MusicTrack } from "@/app/api/music/route"
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

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [returnPath] = useState(() => readReturnPath())
  const draftStorageKey = `champion-blog:edit-post:${id}`
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStatus()
  const [localDraft, setLocalDraft] = useState<LocalDraft | null>(() => readLocalDraft(draftStorageKey))

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
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
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [mediaDialogMode, setMediaDialogMode] = useState<"content" | "cover">("content")
  const [imageUrl, setImageUrl] = useState("")
  const [savedAt, setSavedAt] = useState<string | null>(localDraft?.savedAt ?? null)
  const [availableTracks, setAvailableTracks] = useState<MusicTrack[]>([])
  const [versions, setVersions] = useState<Array<{ id: string; createdAt: string; note?: string; title: string }>>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(`/home?login=1&next=${encodeURIComponent(`/write/${id}?from=${returnPath}`)}`)
      return
    }

    if (!isAuthenticated) {
      return
    }

    fetch(`/api/posts/${id}`)
      .then((response) => response.json())
      .then((post) => {
        setTitle(post.title || "")
        setSlug(post.slug || "")
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
  }, [id, isAuthenticated, isAuthLoading, returnPath, router])

  const clearSavedDraft = useCallback(() => {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(draftStorageKey)
    setLocalDraft(null)
    setSavedAt(null)
  }, [draftStorageKey])

  const restoreLocalDraft = useCallback(() => {
    if (!localDraft) return
    setSlug(localDraft.slug)
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
        slug,
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
  }, [bgmSrc, category, content, coverImage, draft, draftStorageKey, excerpt, isAuthenticated, isAuthLoading, loading, pinned, slug, tags, title])

  useEffect(() => {
    fetch("/api/music", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAvailableTracks(Array.isArray(data.tracks) ? data.tracks : []))
      .catch(() => setAvailableTracks([]))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    fetch(`/api/posts/${id}/versions`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setVersions(Array.isArray(data.versions) ? data.versions : []))
      .catch(() => setVersions([]))
  }, [id, isAuthenticated])

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

  const handleSave = async (publishDraft: boolean) => {
    if (!title || !content) {
      setMessage("标题和内容不能为空")
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
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
          draft: publishDraft,
        }),
      })

      if (res.ok) {
        clearSavedDraft()
        setMessage(publishDraft ? "草稿已保存！" : "文章已更新！")
        if (!publishDraft) {
          setDraft(false)
        }
        setTimeout(() => navigateBack(router, returnPath), 1000)
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
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        navigateBack(router, returnPath)
      }
    } catch {}
  }

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm("确定要恢复到这个历史版本吗？")) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      })
      const data = await res.json()
      if (!res.ok || !data.post) {
        setMessage(data.error || "恢复失败")
        return
      }

      setTitle(data.post.title || "")
      setSlug(data.post.slug || "")
      setExcerpt(data.post.excerpt || "")
      setContent(data.post.content || "")
      setCategory(data.post.category || "随笔")
      setTags((data.post.tags || []).join(", "))
      setCoverImage(data.post.coverImage || "")
      setBgmSrc(data.post.bgmSrc || "")
      setPinned(Boolean(data.post.pinned))
      setDraft(Boolean(data.post.draft))
      setMessage("已恢复到历史版本")
    } catch {
      setMessage("恢复失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <PostEditorPageShell
      pageTitle="编辑文章"
      description="修改你的内容 · 支持上传/粘贴图片"
      savedAtText={savedAt ? `本地草稿最近保存于 ${new Date(savedAt).toLocaleString("zh-CN")}` : null}
      onBack={() => navigateBack(router, returnPath)}
      headerNotice={localDraft ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">检测到未提交的本地草稿。</span>
          <button type="button" onClick={restoreLocalDraft} className="text-primary hover:underline">
            恢复草稿
          </button>
          <button type="button" onClick={clearSavedDraft} className="text-muted-foreground transition-colors hover:text-foreground">
            清除
          </button>
        </div>
      ) : null}
    >
      <div className="space-y-6">
        <PostEditorMetaFields
          title={title}
          slug={slug}
          excerpt={excerpt}
          category={category}
          tags={tags}
          coverImage={coverImage}
          bgmSrc={bgmSrc}
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

        {versions.length > 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">历史版本</h3>
            <div className="space-y-2">
              {versions.slice(0, 6).map((version) => (
                <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{version.note || "编辑记录"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString("zh-CN")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestoreVersion(version.id)}
                    className="text-sm text-primary transition-colors hover:text-primary/80"
                  >
                    恢复
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={draft}
              onChange={(event) => setDraft(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm">存为草稿</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            className="rounded-xl border border-border/60 bg-card px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            保存草稿
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-red-500/50 px-6 py-3 font-medium text-red-500 transition-colors hover:bg-red-500/10"
          >
            删除文章
          </button>
          {message ? (
            <span className={message.includes("成功") || message.includes("已更新") ? "text-green-500" : "text-red-500"}>
              {message}
            </span>
          ) : null}
        </div>
      </div>
    </PostEditorPageShell>
  )
}
