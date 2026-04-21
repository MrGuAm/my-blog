"use client"
/* eslint-disable @next/next/no-img-element */

import type { MusicTrack } from "@/app/api/music/route"

interface PostEditorMetaFieldsProps {
  title: string
  slug: string
  excerpt: string
  category: string
  tags: string
  coverImage: string
  bgmSrc: string
  featured: boolean
  series: string
  seriesOrder: string
  availableTracks: MusicTrack[]
  onTitleChange: (value: string) => void
  onSlugChange: (value: string) => void
  onExcerptChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onTagsChange: (value: string) => void
  onCoverImageChange: (value: string) => void
  onBgmSrcChange: (value: string) => void
  onFeaturedChange: (value: boolean) => void
  onSeriesChange: (value: string) => void
  onSeriesOrderChange: (value: string) => void
  onOpenCoverMediaDialog: () => void
}

export default function PostEditorMetaFields({
  title,
  slug,
  excerpt,
  category,
  tags,
  coverImage,
  bgmSrc,
  featured,
  series,
  seriesOrder,
  availableTracks,
  onTitleChange,
  onSlugChange,
  onExcerptChange,
  onCategoryChange,
  onTagsChange,
  onCoverImageChange,
  onBgmSrcChange,
  onFeaturedChange,
  onSeriesChange,
  onSeriesOrderChange,
  onOpenCoverMediaDialog,
}: PostEditorMetaFieldsProps) {
  return (
    <>
      <div>
        <label className="block mb-2 text-sm font-medium">标题</label>
        <input
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="文章标题"
          className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-lg font-bold transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">文章短链接 slug</label>
        <input
          type="text"
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
          placeholder="my-first-post"
          className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <p className="mt-2 text-xs text-muted-foreground">会根据标题自动生成，也可以自己改，适合做更清晰的文章地址。</p>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">摘要（可选）</label>
        <input
          type="text"
          value={excerpt}
          onChange={(event) => onExcerptChange(event.target.value)}
          placeholder="简单描述一下文章内容..."
          className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium">分类</label>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="随笔">随笔</option>
            <option value="技术">技术</option>
            <option value="生活">生活</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium">标签（可选，用逗号分隔）</label>
          <input
            type="text"
            value={tags}
            onChange={(event) => onTagsChange(event.target.value)}
            placeholder="React, 前端, 笔记"
            className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[auto_1fr_180px]">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-3">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => onFeaturedChange(event.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm font-medium">精选文章</span>
        </label>
        <div>
          <label className="block mb-2 text-sm font-medium">系列名称（可选）</label>
          <input
            type="text"
            value={series}
            onChange={(event) => onSeriesChange(event.target.value)}
            placeholder="比如：做博客这件小事"
            className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium">系列顺序</label>
          <input
            type="number"
            min={1}
            value={seriesOrder}
            onChange={(event) => onSeriesOrderChange(event.target.value)}
            placeholder="1"
            disabled={!series.trim()}
            className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium">封面图（可选）</label>
            <button
              type="button"
              onClick={onOpenCoverMediaDialog}
              className="text-xs text-primary transition-colors hover:text-primary/80"
            >
              从媒体库选择
            </button>
          </div>
          <input
            type="url"
            value={coverImage}
            onChange={(event) => onCoverImageChange(event.target.value)}
            placeholder="https://example.com/cover.jpg"
            className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {coverImage ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-border/40">
              <img src={coverImage} alt="封面预览" className="h-36 w-full object-cover" />
            </div>
          ) : null}
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium">文章 BGM（可选）</label>
          <select
            value={bgmSrc}
            onChange={(event) => onBgmSrcChange(event.target.value)}
            className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
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
    </>
  )
}
