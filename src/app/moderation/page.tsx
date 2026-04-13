import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAuthenticatedServer } from "@/lib/server/auth"
import { listComments } from "@/lib/server/comments"
import { listPosts } from "@/lib/server/store"
import ModerationClient from "./ModerationClient"

export const metadata: Metadata = {
  title: "评论审核",
  description: "管理员评论审核后台",
}

export default async function ModerationPage() {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/moderation")
  }

  const [comments, allComments, posts] = await Promise.all([
    listComments({ statuses: ["pending", "rejected"], limit: 120 }),
    listComments({ statuses: ["approved", "pending", "rejected"], limit: 500 }),
    listPosts({ includeDrafts: true }),
  ])

  const postMap = new Map(posts.map((post) => [post.id, post]))
  const commentMap = new Map(allComments.map((comment) => [comment.id, comment]))
  const items = comments.map((comment) => {
    const post = postMap.get(comment.postId)
    let threadDepth = 0
    let currentParentId = comment.parentCommentId || null
    let parentAuthor = ""
    let parentContent = ""

    while (currentParentId) {
      const parent = commentMap.get(currentParentId)
      if (!parent) break
      threadDepth += 1
      if (!parentAuthor) {
        parentAuthor = parent.author
        parentContent = parent.content
      }
      currentParentId = parent.parentCommentId || null
      if (threadDepth > 12) break
    }

    return {
      ...comment,
      postTitle: post?.title || "未知文章",
      postSlug: post?.slug || post?.id || comment.postId,
      isReply: Boolean(comment.parentCommentId),
      threadDepth,
      parentAuthor: parentAuthor || null,
      parentContent: parentContent || null,
    }
  })

  return <ModerationClient comments={items} />
}
