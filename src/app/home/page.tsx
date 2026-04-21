import type { Metadata } from "next"
import { getAllPosts, getAllTags } from "@/lib/posts"
import { parseHomeQueryState } from "@/lib/home-query"
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

export default async function HomePage({ searchParams }: HomePageProps) {
  const [posts, allTags, siteSettings] = await Promise.all([
    getAllPosts({ includeDrafts: false, cached: true }),
    getAllTags(),
    getSiteSettings(),
  ])
  const state = parseHomeQueryState((await searchParams) || {})

  return (
    <HomeClient
      posts={posts}
      allTags={allTags}
      siteSettings={siteSettings}
      initialSearchQuery={state.searchQuery}
      initialSelectedTag={state.selectedTag}
      initialPage={state.currentPage}
      initialShowDrafts={state.showDrafts}
      loginRequested={state.loginRequested}
      nextPath={state.nextPath}
    />
  )
}
