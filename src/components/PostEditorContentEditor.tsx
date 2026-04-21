"use client"
/* eslint-disable @next/next/no-img-element */

import type { RefObject } from "react"
import MediaLibraryDialog from "@/components/MediaLibraryDialog"

interface PostEditorContentEditorProps {
  title: string
  excerpt: string
  content: string
  coverImage: string
  bgmSrc: string
  previewMode: "edit" | "preview"
  textareaRef: RefObject<HTMLTextAreaElement | null>
  fileInputRef: RefObject<HTMLInputElement | null>
  imageDialogOpen: boolean
  mediaDialogOpen: boolean
  mediaDialogMode: "content" | "cover"
  imageUrl: string
  onPreviewModeChange: (mode: "edit" | "preview") => void
  onContentChange: (value: string) => void
  onLocalImagePick: (file: File) => Promise<void> | void
  onImageDialogToggle: (open: boolean) => void
  onMediaDialogToggle: (open: boolean) => void
  onMediaDialogModeChange: (mode: "content" | "cover") => void
  onImageUrlChange: (value: string) => void
  onInsertImageUrl: () => void
  onInsertFormat: (before: string, after?: string) => void
  onMediaSelect: (url: string) => void
}

export default function PostEditorContentEditor({
  title,
  excerpt,
  content,
  coverImage,
  bgmSrc,
  previewMode,
  textareaRef,
  fileInputRef,
  imageDialogOpen,
  mediaDialogOpen,
  mediaDialogMode,
  imageUrl,
  onPreviewModeChange,
  onContentChange,
  onLocalImagePick,
  onImageDialogToggle,
  onMediaDialogToggle,
  onMediaDialogModeChange,
  onImageUrlChange,
  onInsertImageUrl,
  onInsertFormat,
  onMediaSelect,
}: PostEditorContentEditorProps) {
  return (
    <>
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm font-medium">内容</label>
          <div className="inline-flex rounded-full border border-border/50 bg-card p-1 text-sm">
            <button
              type="button"
              onClick={() => onPreviewModeChange("edit")}
              className={`rounded-full px-3 py-1 transition-colors ${previewMode === "edit" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => onPreviewModeChange("preview")}
              className={`rounded-full px-3 py-1 transition-colors ${previewMode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              预览
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="flex flex-wrap items-center gap-1 border-b border-border/40 bg-secondary/20 px-3 py-2">
            <button type="button" onClick={() => onInsertFormat('<strong>', '</strong>')} className="rounded px-2 py-1 text-sm font-bold transition-colors hover:bg-secondary" title="加粗">B</button>
            <button type="button" onClick={() => onInsertFormat('<em>', '</em>')} className="rounded px-2 py-1 text-sm italic transition-colors hover:bg-secondary" title="斜体">I</button>
            <button type="button" onClick={() => onInsertFormat('<h2>', '</h2>')} className="rounded px-2 py-1 text-sm font-bold transition-colors hover:bg-secondary" title="二级标题">H2</button>
            <button type="button" onClick={() => onInsertFormat('<h3>', '</h3>')} className="rounded px-2 py-1 text-sm font-bold transition-colors hover:bg-secondary" title="三级标题">H3</button>
            <div className="mx-1 h-5 w-px bg-border/40" />
            <button type="button" onClick={() => onInsertFormat('<pre><code>', '</code></pre>')} className="rounded px-2 py-1 text-sm font-mono transition-colors hover:bg-secondary" title="代码块">{"</>"}</button>
            <button type="button" onClick={() => onInsertFormat('<code>', '</code>')} className="rounded px-2 py-1 text-sm font-mono transition-colors hover:bg-secondary" title="行内代码">`</button>
            <div className="mx-1 h-5 w-px bg-border/40" />
            <button type="button" onClick={() => onInsertFormat('<a href="">', '</a>')} className="rounded px-2 py-1 text-sm transition-colors hover:bg-secondary" title="链接">🔗</button>
            <button type="button" onClick={() => onInsertFormat('<blockquote>', '</blockquote>')} className="rounded px-2 py-1 text-sm transition-colors hover:bg-secondary" title="引用">❝</button>
            <button type="button" onClick={() => onInsertFormat('<ul><li>', '</li></ul>')} className="rounded px-2 py-1 text-sm transition-colors hover:bg-secondary" title="无序列表">•</button>
            <div className="mx-1 h-5 w-px bg-border/40" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors hover:bg-secondary"
              title="上传本地图片"
            >
              📁 上传
            </button>
            <button
              type="button"
              onClick={() => onImageDialogToggle(true)}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors hover:bg-secondary"
              title="输入图片链接"
            >
              🖼️ 链接
            </button>
            <button
              type="button"
              onClick={() => {
                onMediaDialogModeChange("content")
                onMediaDialogToggle(true)
              }}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors hover:bg-secondary"
              title="打开媒体库"
            >
              🗂️ 媒体库
            </button>
            <span className="ml-2 text-xs text-muted-foreground">· 支持拖拽 / Ctrl+V 粘贴 / 📁上传</span>
          </div>

          {previewMode === "edit" ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder={"写下你的内容...\n\n💡 提示：\n- 选中文字后点击工具栏按钮可快速格式化\n- 直接 Ctrl/Cmd+V 粘贴图片\n- 点击 📁上传 或 🖼️链接 按钮插入图片"}
              rows={15}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed transition-all focus:outline-none"
            />
          ) : (
            <div className="min-h-[24rem] space-y-5 px-4 py-4">
              {coverImage ? (
                <div className="overflow-hidden rounded-xl border border-border/40">
                  <img src={coverImage} alt={title || "文章封面"} className="h-56 w-full object-cover" />
                </div>
              ) : null}
              <div>
                <h2 className="text-2xl font-black">{title || "未命名文章"}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{excerpt || "这里会显示文章摘要。"}</p>
                {bgmSrc ? (
                  <p className="mt-3 inline-flex rounded-full bg-[#FF9B6B]/15 px-3 py-1 text-xs text-[#FF9B6B]">
                    这篇文章已绑定 BGM
                  </p>
                ) : null}
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: content || "<p>预览内容会显示在这里。</p>" }} />
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          await onLocalImagePick(file)
          event.target.value = ""
        }}
      />

      {imageDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onImageDialogToggle(false)}>
          <div className="w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold">插入图片链接</h3>
            <p className="mb-2 text-sm text-muted-foreground">输入图片网络链接</p>
            <p className="mb-4 text-xs text-muted-foreground">也可以直接点击工具栏 📁上传 按钮选择本地文件</p>
            <input
              type="url"
              value={imageUrl}
              onChange={(event) => onImageUrlChange(event.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mb-4 w-full rounded-lg border border-border/60 bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
              onKeyDown={(event) => event.key === 'Enter' && onInsertImageUrl()}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onInsertImageUrl}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                插入
              </button>
              <button
                type="button"
                onClick={() => onImageDialogToggle(false)}
                className="rounded-lg border border-border/60 px-4 py-2 transition-colors hover:bg-accent"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MediaLibraryDialog
        isOpen={mediaDialogOpen}
        onClose={() => onMediaDialogToggle(false)}
        autoSelectUpload
        uploadHint={mediaDialogMode === "cover" ? "上传后会自动设为封面图" : "上传后会自动插入正文"}
        onSelect={onMediaSelect}
      />
    </>
  )
}
