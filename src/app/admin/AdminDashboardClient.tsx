"use client"
/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import SectionPageShell from "@/components/SectionPageShell"
import type { Post } from "@/lib/posts"
import type { CommentRecord } from "@/lib/server/comments"
import type { UserRecord } from "@/lib/server/store"

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  pinnedPosts: number
  featuredPosts: number
  seriesCount: number
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

type PostFilterKey = "all" | "published" | "draft" | "featured" | "series"

const postFilterOptions: Array<{ key: PostFilterKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "published", label: "已发布" },
  { key: "draft", label: "草稿" },
  { key: "featured", label: "精选" },
  { key: "series", label: "系列中" },
]

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

function sortByUpdatedAt(posts: Post[]) {
  return [...posts].sort(
    (a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime()
  )
}

export default function AdminDashboardClient({
  stats,
  posts,
  latestComments,
  users,
  mediaAssets,
  mediaWarning,
  topTagItems,
  topSeriesItems,
  brandName,
}: {
  stats: DashboardStats
  posts: Post[]
  latestComments: DashboardComment[]
  users: UserRecord[]
  mediaAssets: MediaAssetSummary[]
  mediaWarning?: string | null
  topTagItems: Array<{ label: string; value: number; tone?: string }>
  topSeriesItems: Array<{ label: string; value: number; tone?: string }>
  brandName: string
}) {
  const router = useRouter()
  const [postsState, setPostsState] = useState(posts)
  const [commentsState] = useState(latestComments)
  const [usersState, setUsersState] = useState(users)
  const [processingPostId, setProcessingPostId] = useState<string | null>(null)
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)
  const [postFilter, setPostFilter] = useState<PostFilterKey>("all")
  const [seriesFilter, setSeriesFilter] = useState("all")
  const [message, setMessage] = useState("")

  const publishedPosts = useMemo(() => postsState.filter((post) => !post.draft), [postsState])
  const draftPosts = useMemo(() => postsState.filter((post) => post.draft), [postsState])
  const featuredPosts = useMemo(() => postsState.filter((post) => post.featured && !post.draft), [postsState])
  const topPosts = useMemo(
    () => [...publishedPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
    [publishedPosts]
  )
  const recentDrafts = useMemo(() => sortByUpdatedAt(draftPosts).slice(0, 5), [draftPosts])
  const availableSeries = useMemo(
    () => Array.from(new Set(postsState.map((post) => post.series?.trim()).filter(Boolean) as string[])).sort(),
    [postsState]
  )

  const filteredManagedPosts = useMemo(() => {
    let list = [...postsState]

    if (postFilter === "published") list = list.filter((post) => !post.draft)
    if (postFilter === "draft") list = list.filter((post) => post.draft)
    if (postFilter === "featured") list = list.filter((post) => post.featured)
    if (postFilter === "series") list = list.filter((post) => Boolean(post.series?.trim()))

    if (seriesFilter !== "all") {
      list = list.filter((post) => post.series === seriesFilter)
    }

    return sortByUpdatedAt(list)
  }, [postFilter, postsState, seriesFilter])

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
        setMessage("文章已删除")
      } else {
        setPostsState((current) => current.map((item) => (item.id === post.id ? { ...item, pinned: !item.pinned } : item)))
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
    const confirmed =
      action === "delete"
        ? confirm(`确定要删除评论账号 @${user.username} 吗？`)
        : confirm(action === "ban" ? `确定要封禁 @${user.username} 吗？` : `确定要解除封禁 @${user.username} 吗？`)

    if (!confirmed) return

    setProcessingUserId(user.id)
    setMessage("")
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: action === "delete" ? undefined : { "Content-Type": "application/json" },
        body:
          action === "delete"
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
              ? {
                  ...item,
                  isBanned: action === "ban",
                  bannedAt: action === "ban" ? new Date().toISOString() : null,
                  banReason: action === "ban" ? "管理员封禁" : null,
                }
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
    postsState.forEach((post) => map.set(post.category, (map.get(post.category) || 0) + 1))
    return [...map.entries()].map(([label, value]) => ({ label, value, tone: "bg-[#6C3FF5]" }))
  }, [postsState])

  const moderationChart = [
    { label: "待审核", value: stats.pendingComments, tone: "bg-amber-500" },
    { label: "已通过", value: stats.approvedComments, tone: "bg-emerald-500" },
    { label: "已拒绝", value: stats.rejectedComments, tone: "bg-red-500" },
  ]

  return (
    <SectionPageShell
      navLabel="后台总览"
      activeNav="admin"
      brandLabel={brandName}
      title="站点控制台"
      description="把文章、评论、用户和内容运营信息收在一个入口里。"
    >
      {message ? <p className="mb-4 text-sm text-primary">{message}</p> : null}
      {mediaWarning ? <p className="mb-4 text-sm text-amber-600">{mediaWarning}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="文章总数" value={stats.totalPosts} hint={`${stats.publishedPosts} 已发布 / ${stats.draftPosts} 草稿`} />
        <StatCard label="精选内容" value={stats.featuredPosts} hint={`${stats.pinnedPosts} 篇置顶 / ${featuredPosts.length} 篇公开精选`} />
        <StatCard label="内容系列" value={stats.seriesCount} hint={`${availableSeries.length} 个已命名系列可筛选`} />
        <StatCard label="累计阅读" value={stats.totalViews} hint="已发布文章的总阅读量表现" />
        <StatCard label="评论状态" value={stats.pendingComments} hint={`${stats.approvedComments} 已通过 / ${stats.rejectedComments} 已拒绝`} />
        <StatCard label="评论用户" value={stats.userCount} hint="已注册的评论账号数量" />
        <StatCard label="封禁账号" value={stats.bannedUserCount} hint="当前被管理员限制的评论账号" />
        <StatCard label="媒体素材" value={stats.mediaCount} hint="已上传到站内媒体库的图片数量" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-border/50 bg-card p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">文章管理</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                用筛选快速定位精选、系列文章和草稿，再直接继续编辑。
              </p>
            </div>
            <Link href="/write?from=/admin" className="text-sm text-primary hover:underline">
              写新文章
            </Link>
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/40 bg-background/50 p-3">
            <div className="flex flex-wrap gap-2">
              {postFilterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setPostFilter(option.key)}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    postFilter === option.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>按系列筛选</span>
                <select
                  value={seriesFilter}
                  onChange={(event) => setSeriesFilter(event.target.value)}
                  className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-primary"
                >
                  <option value="all">全部系列</option>
                  {availableSeries.map((series) => (
                    <option key={series} value={series}>
                      {series}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-muted-foreground">当前结果 {filteredManagedPosts.length} 篇</p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredManagedPosts.length > 0 ? (
              filteredManagedPosts.slice(0, 8).map((post) => (
                <div key={post.id} className="rounded-2xl border border-border/40 px-4 py-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={post.draft ? `/write/${post.id}?from=/admin` : `/posts/${post.slug || post.id}`} className="truncate font-medium hover:text-primary">
                          {post.title}
                        </Link>
                        {post.draft ? (
                          <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[11px] text-muted-foreground">草稿</span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600">已发布</span>
                        )}
                        {post.pinned ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">置顶</span> : null}
                        {post.featured ? <span className="rounded-full bg-[#FFB86F]/20 px-2 py-0.5 text-[11px] text-[#C86A00]">精选</span> : null}
                        {post.series ? (
                          <span className="rounded-full bg-[#6C8CFF]/15 px-2 py-0.5 text-[11px] text-[#4A64C8]">
                            系列：{post.series}
                            {post.seriesOrder ? ` · 第 ${post.seriesOrder} 篇` : ""}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {post.category} · 发布 {post.date} · 更新 {new Date(post.updatedAt || post.date).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                        {post.views || 0} 阅读
                      </span>
                      <Link href={`/write/${post.id}?from=/admin`} className="text-xs text-primary hover:underline">
                        编辑
                      </Link>
                      <button
                        type="button"
                        onClick={() => handlePostAction(post, "pin")}
                        disabled={processingPostId === post.id}
                        className="text-xs text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                      >
                        {post.pinned ? "取消置顶" : "置顶"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePostAction(post, "delete")}
                        disabled={processingPostId === post.id}
                        className="text-xs text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-border/50 px-4 py-8 text-sm text-muted-foreground">
                当前筛选条件下还没有文章。
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">热门文章</h2>
              <span className="text-xs text-muted-foreground">按阅读量排序</span>
            </div>
            <div className="space-y-3">
              {topPosts.map((post) => (
                <div key={post.id} className="rounded-2xl border border-border/40 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/posts/${post.slug || post.id}`} className="truncate font-medium hover:text-primary">
                        {post.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">{post.category} · {post.date}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{post.views || 0} 阅读</span>
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
              {recentDrafts.length > 0 ? (
                recentDrafts.map((post) => (
                  <div key={post.id} className="rounded-2xl border border-border/40 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/write/${post.id}?from=/admin`} className="font-medium hover:text-primary">
                          {post.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          最近更新 {new Date(post.updatedAt || post.date).toLocaleString("zh-CN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePostAction(post, "pin")}
                          disabled={processingPostId === post.id}
                          className="text-xs text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                        >
                          {post.pinned ? "取消置顶" : "置顶"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePostAction(post, "delete")}
                          disabled={processingPostId === post.id}
                          className="text-xs text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">现在没有草稿，创作状态很好。</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <MiniBarChart title="文章分类分布" items={categoryChart.length ? categoryChart : [{ label: "暂无数据", value: 0 }]} />
        <MiniBarChart title="评论审核概览" items={moderationChart} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_0.9fr_1.2fr]">
        <MiniBarChart title="热门标签" items={topTagItems.length ? topTagItems : [{ label: "暂无标签", value: 0 }]} />
        <MiniBarChart title="系列分布" items={topSeriesItems.length ? topSeriesItems : [{ label: "暂无系列", value: 0, tone: "bg-[#6C8CFF]" }]} />
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
            <Link href="/moderation" className="text-sm text-primary hover:underline">
              去审核
            </Link>
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
                      {user.isBanned ? (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-500">已封禁</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    {user.isBanned && user.banReason ? <p className="mt-1 text-xs text-red-500">{user.banReason}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString("zh-CN")}</span>
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

      <section className="mt-8 rounded-3xl border border-border/50 bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">备份与恢复中心</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              在项目告一段落前，把文章、版本、评论、评论账号、站点设置、媒体元数据和引用关系导出成站点快照。
            </p>
          </div>
          <a
            href="/api/admin/backup"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            导出站点快照
          </a>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
            <p className="text-sm font-medium">本地导出</p>
            <p className="mt-2 text-sm text-muted-foreground">
              会在仓库根目录生成 `backups/site-snapshot-*/`，其中包含 `snapshot.json` 和本地 `uploads/` 目录副本。
            </p>
            <code className="mt-3 block rounded-xl bg-secondary/50 px-3 py-2 text-xs text-foreground">
              npm run backup:snapshot
            </code>
          </div>
          <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
            <p className="text-sm font-medium">本地恢复</p>
            <p className="mt-2 text-sm text-muted-foreground">
              恢复前会自动备份当前 SQLite 和本地上传目录，适合把博客恢复到某个快照状态。
            </p>
            <code className="mt-3 block rounded-xl bg-secondary/50 px-3 py-2 text-xs text-foreground">
              npm run restore:snapshot -- backups/site-snapshot-*/snapshot.json
            </code>
          </div>
        </div>
      </section>
    </SectionPageShell>
  )
}
