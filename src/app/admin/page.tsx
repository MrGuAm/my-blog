import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAuthenticatedServer } from "@/lib/server/auth"
import { listComments } from "@/lib/server/comments"
import { getMediaLibraryWarning, listMediaAssets } from "@/lib/server/media"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"
import { listPosts, listUsers } from "@/lib/server/store"
import AdminDashboardClient from "./AdminDashboardClient"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "后台总览",
    description: `${settings.brandName} 管理后台`,
  }
}

export default async function AdminPage() {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/admin")
  }

  const [posts, comments, users, mediaAssets, siteSettings] = await Promise.all([
    listPosts({ includeDrafts: true }),
    listComments({ statuses: ["approved", "pending", "rejected"], limit: 200 }),
    listUsers(30),
    listMediaAssets(),
    getSiteSettings(),
  ])
  const mediaWarning = getMediaLibraryWarning()

  const stats = {
    totalPosts: posts.length,
    publishedPosts: posts.filter((post) => !post.draft).length,
    draftPosts: posts.filter((post) => post.draft).length,
    pinnedPosts: posts.filter((post) => post.pinned).length,
    featuredPosts: posts.filter((post) => post.featured).length,
    seriesCount: new Set(posts.map((post) => post.series?.trim()).filter(Boolean)).size,
    totalViews: posts.reduce((sum, post) => sum + (post.views || 0), 0),
    approvedComments: comments.filter((comment) => comment.status === "approved").length,
    pendingComments: comments.filter((comment) => comment.status === "pending").length,
    rejectedComments: comments.filter((comment) => comment.status === "rejected").length,
    userCount: users.length,
    bannedUserCount: users.filter((user) => user.isBanned).length,
    mediaCount: mediaAssets.length,
  }

  const latestComments = comments.slice(0, 8).map((comment) => {
    const post = posts.find((item) => item.id === comment.postId)
    return {
      ...comment,
      postTitle: post?.title || "未知文章",
      postSlug: post?.slug || post?.id || comment.postId,
    }
  })

  const topTags = [...posts]
    .filter((post) => !post.draft)
    .flatMap((post) => post.tags)
    .reduce<Map<string, number>>((map, tag) => map.set(tag, (map.get(tag) || 0) + 1), new Map())

  const topTagItems = [...topTags.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value, tone: "bg-[#FF9B6B]" }))

  const topSeries = [...posts]
    .filter((post) => !post.draft && post.series)
    .reduce<Map<string, number>>((map, post) => {
      const key = post.series!.trim()
      if (!key) return map
      map.set(key, (map.get(key) || 0) + 1)
      return map
    }, new Map())

  const topSeriesItems = [...topSeries.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value, tone: "bg-[#6C8CFF]" }))

  return (
    <AdminDashboardClient
      stats={stats}
      posts={posts}
      latestComments={latestComments}
      users={users}
      mediaAssets={mediaAssets.slice(0, 6)}
      mediaWarning={mediaWarning}
      topTagItems={topTagItems}
      topSeriesItems={topSeriesItems}
      brandName={siteSettings.brandName}
    />
  )
}
