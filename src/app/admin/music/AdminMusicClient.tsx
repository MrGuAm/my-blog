"use client"
/* eslint-disable @next/next/no-img-element */

import { upload } from "@vercel/blob/client"
import { useMemo, useRef, useState } from "react"
import SectionPageShell from "@/components/SectionPageShell"
import {
  buildManagedMusicPath,
  getMusicUploadAcceptValue,
  MUSIC_UPLOAD_HINT,
  validateMusicUploadInput,
} from "@/lib/music-upload"
import type { ManagedMusicTrack } from "@/lib/server/music"

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "未知大小"
  const units = ["B", "KB", "MB", "GB"]
  let value = size
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

function MusicStatCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

export default function AdminMusicClient({
  initialTracks,
  initialWarning = null,
  initialCanUpload = true,
  directBlobUploadEnabled,
  brandName,
}: {
  initialTracks: ManagedMusicTrack[]
  initialWarning?: string | null
  initialCanUpload?: boolean
  directBlobUploadEnabled: boolean
  brandName: string
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [tracks, setTracks] = useState(initialTracks)
  const [keyword, setKeyword] = useState("")
  const [message, setMessage] = useState("")
  const [warning, setWarning] = useState(initialWarning)
  const [canUpload, setCanUpload] = useState(initialCanUpload)
  const [isUploading, setIsUploading] = useState(false)
  const [processingTrackId, setProcessingTrackId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState("")

  const filteredTracks = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return tracks
    return tracks.filter((track) =>
      [track.title, track.artist, track.album || "", track.name, track.pathname]
        .join("\n")
        .toLowerCase()
        .includes(normalized),
    )
  }, [keyword, tracks])

  const stats = useMemo(() => {
    const totalSize = tracks.reduce((sum, track) => sum + (track.size || 0), 0)
    return {
      total: tracks.length,
      blob: tracks.filter((track) => track.storage === "blob").length,
      local: tracks.filter((track) => track.storage === "local").length,
      totalSize,
    }
  }, [tracks])

  async function refreshTracks() {
    const response = await fetch("/api/admin/music", { cache: "no-store" })
    const payload = await response.json()
    setTracks(Array.isArray(payload.tracks) ? payload.tracks : [])
    setWarning(typeof payload.warning === "string" ? payload.warning : null)
    setCanUpload(Boolean(payload.canUpload))
  }

  async function uploadViaDirectBlob(validFiles: File[]) {
    const createdTracks: ManagedMusicTrack[] = []

    for (const [index, file] of validFiles.entries()) {
      setUploadProgress(`正在上传 ${index + 1}/${validFiles.length}：${file.name}`)
      const blob = await upload(buildManagedMusicPath(file.name), file, {
        access: "public",
        handleUploadUrl: "/api/admin/music/client-upload",
        contentType: file.type || undefined,
        multipart: file.size > 4_500_000,
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(`正在上传 ${index + 1}/${validFiles.length}：${file.name}（${Math.round(percentage)}%）`)
        },
      })

      const finalizeResponse = await fetch("/api/admin/music/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname: blob.pathname,
          url: blob.url,
          contentType: blob.contentType,
          size: file.size,
          originalName: file.name,
        }),
      })
      const finalizePayload = await finalizeResponse.json()
      if (!finalizeResponse.ok) {
        throw new Error(finalizePayload.error || `保存 ${file.name} 的曲库信息失败`)
      }
      createdTracks.push(finalizePayload.track as ManagedMusicTrack)
    }

    return createdTracks
  }

  async function uploadViaServerRoute(validFiles: File[]) {
    const formData = new FormData()
    for (const file of validFiles) {
      formData.append("file", file)
    }
    const response = await fetch("/api/admin/music", {
      method: "POST",
      body: formData,
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload.error || "上传音频失败")
    }
    return Array.isArray(payload.tracks) ? (payload.tracks as ManagedMusicTrack[]) : []
  }

  async function handleFiles(selectedFiles: FileList | File[] | null) {
    if (!selectedFiles || !canUpload) return

    const files = Array.from(selectedFiles)
    if (files.length === 0) return

    setIsUploading(true)
    setMessage("")
    setUploadProgress("")

    const failures: string[] = []
    const validFiles: File[] = []

    for (const file of files) {
      const validation = validateMusicUploadInput(file)
      if (!validation.ok) {
        failures.push(`${file.name || "未命名音频"}：${validation.error}`)
        continue
      }
      validFiles.push(file)
    }

    try {
      const createdTracks =
        validFiles.length === 0
          ? []
          : directBlobUploadEnabled
            ? await uploadViaDirectBlob(validFiles)
            : await uploadViaServerRoute(validFiles)

      if (createdTracks.length > 0) {
        setTracks((current) => [
          ...createdTracks,
          ...current.filter((track) => !createdTracks.some((item) => item.id === track.id)),
        ])
      }

      if (createdTracks.length > 0 && failures.length > 0) {
        setMessage(`成功上传 ${createdTracks.length} 首，${failures.length} 首失败。${failures[0]}`)
      } else if (createdTracks.length > 0) {
        setMessage(`成功上传 ${createdTracks.length} 首歌曲`)
      } else if (failures.length > 0) {
        setMessage(failures[0])
      }

      await refreshTracks()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传音频失败，请重试")
    } finally {
      setIsUploading(false)
      setUploadProgress("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleDelete(track: ManagedMusicTrack) {
    if (!track.deletable) return
    const confirmed = confirm(`确定要删除《${track.title}》吗？`)
    if (!confirmed) return

    setProcessingTrackId(track.id)
    setMessage("")
    try {
      const response = await fetch(`/api/admin/music?id=${encodeURIComponent(track.id)}`, {
        method: "DELETE",
      })
      const payload = await response.json()
      if (!response.ok) {
        setMessage(payload.error || "删除失败")
        return
      }
      setTracks((current) => current.filter((item) => item.id !== track.id))
      setMessage("歌曲已删除")
    } catch {
      setMessage("网络错误，请重试")
    } finally {
      setProcessingTrackId(null)
    }
  }

  return (
    <SectionPageShell
      navLabel="在线曲库"
      activeNav="media"
      brandLabel={brandName}
      title="在线上传音乐"
      description="把歌单管理、上传和删除都收进后台，上传后会直接进入站内播放器和文章 BGM 选择器。"
    >
      {message ? <p className="mb-4 text-sm text-primary">{message}</p> : null}
      {warning ? <p className="mb-4 text-sm text-amber-600">{warning}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MusicStatCard label="曲库总数" value={stats.total} hint="包含本地老歌单和在线上传歌曲" />
        <MusicStatCard label="Blob 曲目" value={stats.blob} hint="支持线上直传和删除管理" />
        <MusicStatCard label="本地曲目" value={stats.local} hint="随代码部署的静态音乐文件" />
        <MusicStatCard label="总体积" value={formatBytes(stats.totalSize)} hint="仅按当前可识别文件统计" />
      </section>

      <section className="mt-8 rounded-3xl border border-border/50 bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">上传新歌曲</h2>
            <p className="mt-1 text-sm text-muted-foreground">{MUSIC_UPLOAD_HINT}</p>
            {directBlobUploadEnabled ? (
              <p className="mt-2 text-xs text-muted-foreground">当前已启用直传模式，大于 4.5MB 的音频也可以直接上传到 Blob。</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={getMusicUploadAcceptValue()}
              multiple
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canUpload || isUploading}
              className="brand-solid-button px-5 py-2 disabled:opacity-50"
            >
              {isUploading ? "上传中..." : "选择音频上传"}
            </button>
            <button
              type="button"
              onClick={() => void refreshTracks()}
              className="apple-button-secondary"
            >
              刷新列表
            </button>
          </div>
        </div>
        {uploadProgress ? <p className="mt-3 text-sm text-muted-foreground">{uploadProgress}</p> : null}
      </section>

      <section className="mt-8 rounded-3xl border border-border/50 bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">曲库列表</h2>
            <p className="mt-1 text-sm text-muted-foreground">上传后会同步进入音乐页、悬浮播放器和文章 BGM 选择器。</p>
          </div>
          <label className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-2 text-sm text-muted-foreground">
            <span>搜索</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="歌名、歌手、文件名"
              className="min-w-[12rem] bg-transparent text-sm text-foreground outline-none"
            />
          </label>
        </div>

        <div className="mt-5 space-y-3">
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track) => (
              <div key={track.id} className="rounded-2xl border border-border/40 px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-secondary/40">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt={track.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">🎵</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{track.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${track.storage === "blob" ? "bg-primary/10 text-primary" : "bg-secondary/70 text-muted-foreground"}`}>
                          {track.storage === "blob" ? "Blob" : "本地"}
                        </span>
                        {track.album ? (
                          <span className="rounded-full bg-[#6C8CFF]/15 px-2 py-0.5 text-[11px] text-[#4A64C8]">
                            {track.album}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{track.artist}</p>
                      <p className="mt-2 break-all text-xs text-muted-foreground">{track.src}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatBytes(track.size)} · {track.contentType} · 更新 {new Date(track.updatedAt).toLocaleString("zh-CN")}
                      </p>
                      {track.lyrics ? <p className="mt-2 text-xs text-muted-foreground">已读取内嵌歌词</p> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(track.src).then(() => setMessage("歌曲链接已复制"))}
                      className="apple-button-secondary"
                    >
                      复制链接
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(track.src, "_blank", "noopener,noreferrer")}
                      className="apple-button-secondary"
                    >
                      打开原文件
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(track)}
                      disabled={!track.deletable || processingTrackId === track.id}
                      aria-label={`删除歌曲 ${track.title}`}
                      className="rounded-full border border-red-500/20 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/8 disabled:opacity-40"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-border/50 px-4 py-10 text-sm text-muted-foreground">
              {keyword ? "当前关键词下没有找到歌曲。" : "曲库里还没有歌曲。"}
            </p>
          )}
        </div>
      </section>
    </SectionPageShell>
  )
}
