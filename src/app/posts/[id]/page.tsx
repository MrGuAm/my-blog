import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllPosts, getPost, getPostContent, getAllTags } from "@/lib/posts"
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

  const content = await getPostContent(id)

  return <PostClient post={post} content={content} />
}
