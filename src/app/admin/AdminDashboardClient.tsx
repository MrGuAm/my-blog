"use client"
/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import type { CommentRecord } from "@/lib/server/comments"
import type { UserRecord } from "@/lib/server/store"
import type { Post } from "@/lib/posts"

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  pinnedPosts: number
  totalViews: number
  approvedComments: number
  pendingComments: number
  rejectedComments: number
  userCount: number
  bannedUserCount: number
  mediaCount: number
}

interface DashboardComment extends CommentRecord {
  postTitle: string
  postSlug: string
}

interface MediaAssetSummary {
  id: string
  name: string
  url: string
  size: number
  updatedAt: string
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function MiniBarChart({ title, items }: { title: string; items: Array<{ label: string; value: number; tone?: string }> }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <div className="rounded-3xl border border-border/50 bg-card p-5">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/50">
              <div
                className={`h-full rounded-full ${item.tone || "bg-primary"}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboardClient({
  stats,
  topPosts,
  recentDrafts,
  latestComments,
  users,
  mediaAssets,
  mediaWarning,
  topTagItems,
}: {
  stats: DashboardStats
  topPosts: Post[]
  recentDrafts: Post[]
  latestComments: DashboardComment[]
  users: UserRecord[]
  mediaAssets: MediaAssetSummary[]
  mediaWarning?: string | null
  topTagItems: Array<{ label: string; value: number; tone?: string }>
}) {
  const router = useRouter()
  const { logout } = useAuthStatus()
  const [postsState, setPostsState] = useState(topPosts)
  const [draftsState, setDraftsState] = useState(recentDrafts)
  const [commentsState] = useState(latestComments)
  const [usersState, setUsersState] = useState(users)
  const [processingPostId, setProcessingPostId] = useState<string | null>(null)
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const allManagedPosts = useMemo(() => {
    const merged = [...postsState]
    for (const post of draftsState) {
      if (!merged.some((item) => item.id === post.id)) merged.push(post)
    }
    return merged
  }, [draftsState, postsState])

  async function handlePostAction(post: Post, action: "pin" | "delete") {
    setProcessingPostId(post.id)
    setMessage("")
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: action === "delete" ? undefined : { "Content-Type": "application/json" },
        body: action === "delete" ? undefined : JSON.stringify({ pinned: !post.pinned }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(data.error || "操作失败")
        return
      }

      if (action === "delete") {
        setPostsState((current) => current.filter((item) => item.id !== post.id))
        setDraftsState((current) => current.filter((item) => item.id !== post.id))
        setMessage("文章已删除")
      } else {
        setPostsState((current) => current.map((item) => (item.id === post.id ? { ...item, pinned: !item.pinned } : item)))
        setDraftsState((current) => current.map((item) => (item.id === post.id ? { ...item, pinned: !item.pinned } : item)))
        setMessage(post.pinned ? "已取消置顶" : "已置顶")
      }
      router.refresh()
    } catch {
      setMessage("网络错误，请重试")
    } finally {
      setProcessingPostId(null)
    }
  }

  async function handleUserAction(user: UserRecord, action: "ban" | "unban" | "delete") {
    const confirmed = action === "delete"
      ? confirm(`确定要删除评论账号 @${user.username} 吗？`)
      : confirm(action === "ban" ? `确定要封禁 @${user.username} 吗？` : `确定要解除封禁 @${user.username} 吗？`)

    if (!confirmed) return

    setProcessingUserId(user.id)
    setMessage("")
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: action === "delete" ? undefined : { "Content-Type": "application/json" },
        body: action === "delete"
          ? undefined
          : JSON.stringify({
              action,
              reason: action === "ban" ? "管理员封禁" : "",
            }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setMessage(data.error || "用户操作失败")
        return
      }

      if (action === "delete") {
        setUsersState((current) => current.filter((item) => item.id !== user.id))
        setMessage("评论账号已删除")
      } else {
        setUsersState((current) =>
          current.map((item) =>
            item.id === user.id
              ? { ...item, isBanned: action === "ban", bannedAt: action === "ban" ? new Date().toISOString() : null, banReason: action === "ban" ? "管理员封禁" : null }
              : item
          )
        )
        setMessage(action === "ban" ? "评论账号已封禁" : "评论账号已解除封禁")
      }
      router.refresh()
    } catch {
      setMessage("网络错误，请重试")
    } finally {
      setProcessingUserId(null)
    }
  }

  const categoryChart = useMemo(() => {
    const map = new Map<string, number>()
    allManagedPosts.forEach((post) => map.set(post.category, (map.get(post.category) || 0) + 1))
    return [...map.entries()].map(([label, value]) => ({ label, value, tone: "bg-[#6C3FF5]" }))
  }, [allManagedPosts])

  const moderationChart = [
    { label: "待审核", value: stats.pendingComments, tone: "bg-amber-500" },
    { label: "已通过", value: stats.approvedComments, tone: "bg-emerald-500" },
    { label: "已拒绝", value: stats.rejectedComments, tone: "bg-red-500" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#6C3FF5]/60">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-lg font-black">后台总览</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/home" className="text-sm text-muted-foreground transition-colors hover:text-primary">首页</Link>
            <Link href="/write" className="text-sm text-muted-foreground transition-colors hover:text-primary">写文章</Link>
            <Link href="/moderation" className="text-sm text-muted-foreground transition-colors hover:text-primary">评论审核</Link>
            <Link href="/admin/media" className="text-sm text-muted-foreground transition-colors hover:text-primary">媒体库</Link>
            <Link href="/music" className="text-sm text-muted-foreground transition-colors hover:text-primary">音乐页</Link>
            <button onClick={logout} className="text-sm text-red-500 transition-colors hover:text-red-600">退出</button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">站点控制台</h1>
          <p className="mt-2 text-muted-foreground">把文章、评论、用户和内容运营信息收在一个入口里。</p>
          {message && <p className="mt-3 text-sm text-primary">{message}</p>}
          {mediaWarning && <p className="mt-2 text-sm text-amber-600">{mediaWarning}</p>}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="文章总数" value={stats.totalPosts} hint={`${stats.publishedPosts} 已发布 / ${stats.draftPosts} 草稿`} />
          <StatCard label="累计阅读" value={stats.totalViews} hint={`${stats.pinnedPosts} 篇置顶文章`} />
          <StatCard label="评论状态" value={stats.pendingComments} hint={`${stats.approvedComments} 已通过 / ${stats.rejectedComments} 已拒绝`} />
          <StatCard label="评论用户" value={stats.userCount} hint="已注册的评论账号数量" />
          <StatCard label="封禁账号" value={stats.bannedUserCount} hint="当前被管理员限制的评论账号" />
          <StatCard label="媒体素材" value={stats.mediaCount} hint="已上传到站内媒体库的图片数量" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">热门文章</h2>
              <Link href="/write?from=/admin" className="text-sm text-primary hover:underline">写新文章</Link>
            </div>
            <div className="space-y-3">
              {postsState.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-border/40 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/posts/${post.slug || post.id}`} className="truncate font-medium hover:text-primary">
                        {post.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">{post.category} · {post.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{post.views || 0} 阅读</span>
                      <Link href={`/write/${post.id}?from=/admin`} className="text-xs text-primary hover:underline">编辑</Link>
                      <button
                        type="button"
                        onClick={() => handlePostAction(post, "pin")}
                        disabled={processingPostId === post.id}
                        className="text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
                      >
                        {post.pinned ? "取消置顶" : "置顶"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePostAction(post, "delete")}
                        disabled={processingPostId === post.id}
                        className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">最近草稿</h2>
              <span className="text-xs text-muted-foreground">继续创作</span>
            </div>
            <div className="space-y-3">
              {draftsState.length > 0 ? draftsState.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-border/40 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/write/${post.id}?from=/admin`} className="font-medium hover:text-primary">{post.title}</Link>
                      <p className="mt-1 text-xs text-muted-foreground">最近更新 {new Date(post.updatedAt || post.date).toLocaleString("zh-CN")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePostAction(post, "pin")}
                        disabled={processingPostId === post.id}
                        className="text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
                      >
                        {post.pinned ? "取消置顶" : "置顶"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePostAction(post, "delete")}
                        disabled={processingPostId === post.id}
                        className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">现在没有草稿，创作状态很好。</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <MiniBarChart title="文章分类分布" items={categoryChart.length ? categoryChart : [{ label: "暂无数据", value: 0 }]} />
          <MiniBarChart title="评论审核概览" items={moderationChart} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <MiniBarChart title="热门标签" items={topTagItems.length ? topTagItems : [{ label: "暂无标签", value: 0 }]} />
          <div className="rounded-3xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">最近素材</h2>
              <span className="text-xs text-muted-foreground">媒体库预览</span>
            </div>
            {mediaAssets.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {mediaAssets.map((asset) => (
                  <div key={asset.id} className="overflow-hidden rounded-2xl border border-border/40 bg-background/60">
                    <img src={asset.url} alt={asset.name} className="h-28 w-full object-cover" />
                    <div className="px-3 py-2">
                      <p className="truncate text-xs font-medium">{asset.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">媒体库还没有图片。</p>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">最新评论动态</h2>
              <Link href="/moderation" className="text-sm text-primary hover:underline">去审核</Link>
            </div>
            <div className="space-y-3">
              {commentsState.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-border/40 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{comment.author}</span>
                    <span>·</span>
                    <span>{comment.date}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        comment.status === "pending"
                          ? "bg-amber-500/15 text-amber-600"
                          : comment.status === "rejected"
                            ? "bg-red-500/15 text-red-500"
                            : "bg-emerald-500/15 text-emerald-600"
                      }`}
                    >
                      {comment.status === "pending" ? "待审核" : comment.status === "rejected" ? "已拒绝" : "已通过"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{comment.content}</p>
                  <Link href={`/posts/${comment.postSlug}`} className="mt-2 inline-block text-xs text-primary hover:underline">
                    {comment.postTitle}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">最近注册用户</h2>
              <span className="text-xs text-muted-foreground">评论账号</span>
            </div>
            <div className="space-y-3">
              {usersState.map((user) => (
                <div key={user.id} className="rounded-2xl border border-border/40 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.displayName}</p>
                        {user.isBanned && (
                          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-500">已封禁</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      {user.isBanned && user.banReason && (
                        <p className="mt-1 text-xs text-red-500">{user.banReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUserAction(user, user.isBanned ? "unban" : "ban")}
                        disabled={processingUserId === user.id}
                        className="text-xs text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                      >
                        {user.isBanned ? "解封" : "封禁"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUserAction(user, "delete")}
                        disabled={processingUserId === user.id}
                        className="text-xs text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
