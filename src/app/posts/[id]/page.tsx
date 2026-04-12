import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { getAdjacentPosts, getAllPosts, getPost, getPostContent, calculateReadingTime, extractHeadings, getRelatedPosts } from "@/lib/posts"
import { isAuthenticatedServer } from "@/lib/server/auth"
import PostClient from "./PostClient"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)
  
  if (!post) {
    return {
      title: "文章未找到 | Champion's Blog",
    }
  }

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: `${post.title} | Champion's Blog`,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
      authors: ["Champion"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  }
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const posts = await getAllPosts({ includeDrafts: false, cached: true })
  return posts.map((post) => ({
    id: post.slug || post.id,
  }))
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const decodedId = decodeURIComponent(id)
  const post = await getPost(decodedId)

  if (!post) {
    notFound()
  }

  // If post is a draft, check auth on server side before rendering
  if (post.draft) {
    const isAuthenticated = await isAuthenticatedServer()
    if (!isAuthenticated) {
      redirect(`/home?login=1&next=/write/${post.id}`)
    }
    // Authenticated user viewing a draft -> go to edit page
    redirect(`/write/${post.id}`)
  }

  const content = await getPostContent(decodedId)

  // 给标题注入 ID，便于目录跳转
  const contentWithIds = content.replace(/<h([23])([^>]*)>([^<]+)<\/h([23])>/gi, (match, level, attrs, text, closeLevel) => {
    const headingId = text.trim().toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `<h${level}${attrs} id="${headingId}">${text}</h${closeLevel}>`
  })

  const readingTime = calculateReadingTime(content)
  const headings = extractHeadings(contentWithIds)
  const [relatedPosts, adjacentPosts] = await Promise.all([
    getRelatedPosts(post),
    getAdjacentPosts(post),
  ])

  return (
    <PostClient
      post={post}
      content={contentWithIds}
      readingTime={readingTime}
      headings={headings}
      relatedPosts={relatedPosts}
      previousPost={adjacentPosts.previousPost}
      nextPost={adjacentPosts.nextPost}
    />
  )
}
