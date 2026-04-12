"use client"

import Link from "next/link"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import type { CommentRecord, UserRecord } from "@/lib/server/store"
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
}

interface DashboardComment extends CommentRecord {
  postTitle: string
  postSlug: string
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

export default function AdminDashboardClient({
  stats,
  topPosts,
  recentDrafts,
  latestComments,
  users,
}: {
  stats: DashboardStats
  topPosts: Post[]
  recentDrafts: Post[]
  latestComments: DashboardComment[]
  users: UserRecord[]
}) {
  const { logout } = useAuthStatus()

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
            <Link href="/music" className="text-sm text-muted-foreground transition-colors hover:text-primary">音乐页</Link>
            <button onClick={logout} className="text-sm text-red-500 transition-colors hover:text-red-600">退出</button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">站点控制台</h1>
          <p className="mt-2 text-muted-foreground">把文章、评论、用户和内容运营信息收在一个入口里。</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="文章总数" value={stats.totalPosts} hint={`${stats.publishedPosts} 已发布 / ${stats.draftPosts} 草稿`} />
          <StatCard label="累计阅读" value={stats.totalViews} hint={`${stats.pinnedPosts} 篇置顶文章`} />
          <StatCard label="评论状态" value={stats.pendingComments} hint={`${stats.approvedComments} 已通过 / ${stats.rejectedComments} 已拒绝`} />
          <StatCard label="评论用户" value={stats.userCount} hint="已注册的评论账号数量" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">热门文章</h2>
              <Link href="/write" className="text-sm text-primary hover:underline">写新文章</Link>
            </div>
            <div className="space-y-3">
              {topPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.slug || post.id}`}
                  className="block rounded-2xl border border-border/40 px-4 py-3 hover:border-primary/40 hover:bg-accent/20"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{post.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{post.category} · {post.date}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{post.views || 0} 阅读</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">最近草稿</h2>
              <span className="text-xs text-muted-foreground">继续创作</span>
            </div>
            <div className="space-y-3">
              {recentDrafts.length > 0 ? recentDrafts.map((post) => (
                <Link
                  key={post.id}
                  href={`/write/${post.id}`}
                  className="block rounded-2xl border border-border/40 px-4 py-3 hover:border-primary/40 hover:bg-accent/20"
                >
                  <p className="font-medium">{post.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">最近更新 {new Date(post.updatedAt || post.date).toLocaleString("zh-CN")}</p>
                </Link>
              )) : (
                <p className="text-sm text-muted-foreground">现在没有草稿，创作状态很好。</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">最新评论动态</h2>
              <Link href="/moderation" className="text-sm text-primary hover:underline">去审核</Link>
            </div>
            <div className="space-y-3">
              {latestComments.map((comment) => (
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
              {users.map((user) => (
                <div key={user.id} className="rounded-2xl border border-border/40 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </span>
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
