import type { Metadata } from "next"
import { getAllPosts, getAllTags } from "@/lib/posts"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"
import HomeClient from "./home/HomeClient"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: settings.brandName,
    description: settings.siteDescription,
    openGraph: {
      title: settings.brandName,
      description: settings.siteDescription,
    },
  }
}

export default async function HomePage() {
  const [posts, allTags, siteSettings] = await Promise.all([
    getAllPosts({ includeDrafts: false, cached: true }),
    getAllTags(),
    getSiteSettings(),
  ])
  return <HomeClient posts={posts} allTags={allTags} siteSettings={siteSettings} />
}
