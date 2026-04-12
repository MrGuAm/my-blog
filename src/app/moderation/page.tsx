import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAuthenticatedServer } from "@/lib/server/auth"
import { listComments, listPosts } from "@/lib/server/store"
import ModerationClient from "./ModerationClient"

export const metadata: Metadata = {
  title: "评论审核",
  description: "管理员评论审核后台",
}

export default async function ModerationPage() {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/login")
  }

  const [comments, posts] = await Promise.all([
    listComments({ statuses: ["pending", "rejected"], limit: 120 }),
    listPosts({ includeDrafts: true }),
  ])

  const postMap = new Map(posts.map((post) => [post.id, post]))
  const items = comments.map((comment) => {
    const post = postMap.get(comment.postId)
    return {
      ...comment,
      postTitle: post?.title || "未知文章",
      postSlug: post?.slug || post?.id || comment.postId,
    }
  })

  return <ModerationClient comments={items} />
}
