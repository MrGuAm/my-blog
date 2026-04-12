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

export default async function HomePage() {
  const [posts, allTags] = await Promise.all([getAllPosts(), getAllTags()])
  return <HomeClient posts={posts} allTags={allTags} />
}
