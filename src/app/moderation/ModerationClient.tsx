"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStatus } from "@/hooks/useAuthStatus"

interface ModerationComment {
  id: string
  postId: string
  postTitle: string
  postSlug: string
  author: string
  content: string
  date: string
  status?: "pending" | "approved" | "rejected"
  moderationNote?: string | null
  isReply?: boolean
  threadDepth?: number
  parentAuthor?: string | null
  parentContent?: string | null
}

export default function ModerationClient({ comments: initialComments }: { comments: ModerationComment[] }) {
  const router = useRouter()
  const { logout } = useAuthStatus()
  const [comments, setComments] = useState(initialComments)
  const [filter, setFilter] = useState<"pending" | "rejected" | "all">("pending")
  const [threadFilter, setThreadFilter] = useState<"all" | "top-level" | "replies">("all")
  const [keyword, setKeyword] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const filteredComments = useMemo(() => {
    const statusMatched = filter === "all" ? comments : comments.filter((comment) => comment.status === filter)
    const threadMatched = threadFilter === "all"
      ? statusMatched
      : statusMatched.filter((comment) => threadFilter === "replies" ? comment.isReply : !comment.isReply)
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) return threadMatched
    return threadMatched.filter((comment) =>
      comment.author.toLowerCase().includes(normalizedKeyword) ||
      comment.content.toLowerCase().includes(normalizedKeyword) ||
      comment.postTitle.toLowerCase().includes(normalizedKeyword) ||
      (comment.parentAuthor || "").toLowerCase().includes(normalizedKeyword) ||
      (comment.parentContent || "").toLowerCase().includes(normalizedKeyword)
    )
  }, [comments, filter, keyword, threadFilter])

  const threadStats = useMemo(() => ({
    all: comments.length,
    topLevel: comments.filter((comment) => !comment.isReply).length,
    replies: comments.filter((comment) => comment.isReply).length,
  }), [comments])

  async function handleModeration(comment: ModerationComment, status: "approved" | "rejected") {
    setProcessingId(comment.id)
    setMessage("")
    try {
      const response = await fetch(`/api/comments/${comment.postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.id, status }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || "处理失败")
        return
      }

      setComments((current) =>
        current.map((item) => (item.id === comment.id ? { ...item, ...data.comment } : item))
      )
      setSelectedIds((current) => current.filter((item) => item !== comment.id))
      setMessage(status === "approved" ? "评论已通过" : "评论已拒绝")
      router.refresh()
    } catch {
      setMessage("网络错误，请重试")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleBatch(status: "approved" | "rejected") {
    if (selectedIds.length === 0) return
    setMessage("")
    for (const commentId of selectedIds) {
      const comment = comments.find((item) => item.id === commentId)
      if (!comment) continue
      await handleModeration(comment, status)
    }
    setSelectedIds([])
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#6C3FF5]/60">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-lg font-black">评论审核</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              返回后台
            </Link>
            <Link href="/write" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              写文章
            </Link>
            <Link href="/home" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              返回首页
            </Link>
            <button onClick={logout} className="text-sm text-red-500 transition-colors hover:text-red-600">
              退出
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">待审核评论</h1>
            <p className="mt-2 text-muted-foreground">游客评论会先进入这里，确认后再公开显示。</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索评论、作者或文章"
              className="w-full rounded-xl border border-border/50 bg-card px-3 py-2 text-sm md:w-64"
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full border border-border/50 bg-card p-1 text-sm">
                {[
                  ["pending", "待审核"],
                  ["rejected", "已拒绝"],
                  ["all", "全部"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value as "pending" | "rejected" | "all")}
                    className={`rounded-full px-3 py-1 transition-colors ${
                      filter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-full border border-border/50 bg-card p-1 text-sm">
                {[
                  ["all", `全部 ${threadStats.all}`],
                  ["top-level", `主评论 ${threadStats.topLevel}`],
                  ["replies", `回复 ${threadStats.replies}`],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setThreadFilter(value as "all" | "top-level" | "replies")}
                    className={`rounded-full px-3 py-1 transition-colors ${
                      threadFilter === value ? "bg-secondary text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleBatch("approved")}
                disabled={selectedIds.length === 0}
                className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                批量通过
              </button>
              <button
                type="button"
                onClick={() => handleBatch("rejected")}
                disabled={selectedIds.length === 0}
                className="rounded-xl border border-red-500/40 px-3 py-2 text-sm text-red-500 disabled:opacity-50"
              >
                批量拒绝
              </button>
            </div>
          </div>
        </div>

        {message && <p className="mb-4 text-sm text-primary">{message}</p>}

        <div className="space-y-4">
          {filteredComments.length > 0 ? (
            filteredComments.map((comment) => (
              <div key={comment.id} className="rounded-2xl border border-border/50 bg-card p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(comment.id)}
                    onChange={(event) => {
                      setSelectedIds((current) =>
                        event.target.checked ? [...current, comment.id] : current.filter((item) => item !== comment.id)
                      )
                    }}
                    className="mr-1"
                  />
                  <span className="text-sm font-semibold">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{comment.date}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      comment.status === "pending"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-red-500/15 text-red-500"
                    }`}
                  >
                    {comment.status === "pending" ? "待审核" : "已拒绝"}
                  </span>
                  <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {comment.isReply ? `回复 · 第 ${Math.max(comment.threadDepth || 1, 1)} 层` : "主评论"}
                  </span>
                  <Link href={`/posts/${comment.postSlug}`} className="ml-auto text-xs text-primary hover:underline">
                    查看文章：{comment.postTitle}
                  </Link>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{comment.content}</p>
                {comment.isReply && (
                  <div className="mt-3 rounded-2xl border border-border/40 bg-background/70 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      回复给 {comment.parentAuthor || "上一条评论"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                      {comment.parentContent || "原评论可能已经被删除"}
                    </p>
                  </div>
                )}
                {comment.moderationNote && (
                  <p className="mt-3 text-xs text-muted-foreground">备注：{comment.moderationNote}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleModeration(comment, "approved")}
                    disabled={processingId === comment.id}
                    className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {processingId === comment.id ? "处理中..." : "通过"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeration(comment, "rejected")}
                    disabled={processingId === comment.id}
                    className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
              当前没有需要处理的评论。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
