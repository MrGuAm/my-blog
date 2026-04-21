import type { Metadata } from "next"
import { getAllPosts, getAllTags } from "@/lib/posts"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"
import HomeClient from "./HomeClient"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "首页",
    description: settings.siteDescription,
    openGraph: {
      title: settings.brandName,
      description: settings.siteDescription,
    },
  }
}

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] || null : value || null
}

function getSafeNextPath(value?: string | string[]) {
  const next = getSingleParam(value)
  if (!next) return null
  return next.startsWith("/") && !next.startsWith("//") ? next : null
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [posts, allTags, siteSettings] = await Promise.all([
    getAllPosts({ includeDrafts: false, cached: true }),
    getAllTags(),
    getSiteSettings(),
  ])
  const params = (await searchParams) || {}

  return (
    <HomeClient
      posts={posts}
      allTags={allTags}
      siteSettings={siteSettings}
      loginRequested={getSingleParam(params.login) === "1"}
      nextPath={getSafeNextPath(params.next)}
    />
  )
}
