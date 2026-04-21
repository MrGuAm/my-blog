import type { Metadata } from "next"
import { getAllPosts, getAllTags } from "@/lib/posts"
import { siteConfig } from "@/lib/site-config"
import HomeClient from "./home/HomeClient"

export const revalidate = 300

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
  },
}

export default async function HomePage() {
  const [posts, allTags] = await Promise.all([getAllPosts({ includeDrafts: false, cached: true }), getAllTags()])
  return <HomeClient posts={posts} allTags={allTags} />
}
