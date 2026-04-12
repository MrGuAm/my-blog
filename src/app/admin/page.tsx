import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAuthenticatedServer } from "@/lib/server/auth"
import { listComments, listPosts, listUsers } from "@/lib/server/store"
import AdminDashboardClient from "./AdminDashboardClient"

export const metadata: Metadata = {
  title: "后台总览",
  description: "Champion's Blog 管理后台",
}

export default async function AdminPage() {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/admin")
  }

  const [posts, comments, users] = await Promise.all([
    listPosts({ includeDrafts: true }),
    listComments({ statuses: ["approved", "pending", "rejected"], limit: 200 }),
    listUsers(30),
  ])

  const stats = {
    totalPosts: posts.length,
    publishedPosts: posts.filter((post) => !post.draft).length,
    draftPosts: posts.filter((post) => post.draft).length,
    pinnedPosts: posts.filter((post) => post.pinned).length,
    totalViews: posts.reduce((sum, post) => sum + (post.views || 0), 0),
    approvedComments: comments.filter((comment) => comment.status === "approved").length,
    pendingComments: comments.filter((comment) => comment.status === "pending").length,
    rejectedComments: comments.filter((comment) => comment.status === "rejected").length,
    userCount: users.length,
  }

  const topPosts = [...posts]
    .filter((post) => !post.draft)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)

  const recentDrafts = [...posts]
    .filter((post) => post.draft)
    .sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime())
    .slice(0, 5)

  const latestComments = comments.slice(0, 8).map((comment) => {
    const post = posts.find((item) => item.id === comment.postId)
    return {
      ...comment,
      postTitle: post?.title || "未知文章",
      postSlug: post?.slug || post?.id || comment.postId,
    }
  })

  return (
    <AdminDashboardClient
      stats={stats}
      topPosts={topPosts}
      recentDrafts={recentDrafts}
      latestComments={latestComments}
      users={users}
    />
  )
}
