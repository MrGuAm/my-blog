import type { Metadata } from "next"
import { getAllPosts, getAllTags } from "@/lib/posts"
import { siteConfig } from "@/lib/site-config"
import { getSiteSettings } from "@/lib/server/site-settings"
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
  const [posts, allTags, siteSettings] = await Promise.all([
    getAllPosts({ includeDrafts: false, cached: true }),
    getAllTags(),
    getSiteSettings(),
  ])
  return <HomeClient posts={posts} allTags={allTags} siteSettings={siteSettings} />
}
