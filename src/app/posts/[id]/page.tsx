import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { getAllPosts, getPost, getPostContent, calculateReadingTime, extractHeadings, getRelatedPosts } from "@/lib/posts"
import PostClient from "./PostClient"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = getPost(id)
  
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
  const posts = getAllPosts()
  return posts.map((post) => ({
    id: post.id,
  }))
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const post = getPost(id)

  if (!post) {
    notFound()
  }

  // If post is a draft, check auth on server side before rendering
  if (post.draft) {
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.get("authenticated")?.value === "true"
    if (!isAuthenticated) {
      redirect("/login")
    }
  }

  const content = await getPostContent(id)

  // 给标题注入 ID，便于目录跳转
  const contentWithIds = content.replace(/<h([23])([^>]*)>([^<]+)<\/h([23])>/gi, (match, level, attrs, text, closeLevel) => {
    const headingId = text.trim().toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `<h${level}${attrs} id="${headingId}">${text}</h${closeLevel}>`
  })

  const readingTime = calculateReadingTime(content)
  const headings = extractHeadings(contentWithIds)
  const relatedPosts = getRelatedPosts(post)

  return <PostClient post={post} content={contentWithIds} readingTime={readingTime} headings={headings} relatedPosts={relatedPosts} />
}
