import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { posts, getPost } from "@/lib/posts"
import PostClient from "./PostClient"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = getPost(Number(id))
  
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
  return posts.map((post) => ({
    id: String(post.id),
  }))
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const post = getPost(Number(id))
  
  if (!post) {
    notFound()
  }

  return <PostClient />
}
