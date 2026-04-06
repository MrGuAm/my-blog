import type { Metadata } from "next"
import { getAllPosts, getAllTags } from "@/lib/posts"
import HomeClient from "./home/HomeClient"

export const metadata: Metadata = {
  title: "Champion's Blog",
  description: "记录生活，分享想法 - Champion 的个人博客",
  openGraph: {
    title: "Champion's Blog",
    description: "记录生活，分享想法 - Champion 的个人博客",
  },
}

export default function HomePage() {
  const posts = getAllPosts()
  const allTags = getAllTags()
  return <HomeClient posts={posts} allTags={allTags} />
}
