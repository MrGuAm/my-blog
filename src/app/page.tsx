import type { Metadata } from "next"
import { getAllPosts, getAllTags } from "@/lib/posts"
import { parseHomeQueryState } from "@/lib/home-query"
import { filterPostsForListing } from "@/lib/post-search"
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

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const state = parseHomeQueryState((await searchParams) || {})
  const [posts, allTags, siteSettings] = await Promise.all([
    getAllPosts({ includeDrafts: false, cached: true }),
    getAllTags(),
    getSiteSettings(),
  ])
  const initialPosts = filterPostsForListing(posts, {
    includeDrafts: false,
    searchQuery: state.searchQuery,
    selectedTag: state.selectedTag,
  })

  return (
    <HomeClient
      posts={initialPosts}
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
