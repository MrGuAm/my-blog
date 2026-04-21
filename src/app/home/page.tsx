import type { Metadata } from "next"
import { getAllPosts, getAllTags } from "@/lib/posts"
import { siteConfig } from "@/lib/site-config"
import HomeClient from "./HomeClient"

export const revalidate = 300

export const metadata: Metadata = {
  title: "首页",
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
  },
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
  const [posts, allTags] = await Promise.all([getAllPosts({ includeDrafts: false, cached: true }), getAllTags()])
  const params = (await searchParams) || {}

  return (
    <HomeClient
      posts={posts}
      allTags={allTags}
      loginRequested={getSingleParam(params.login) === "1"}
      nextPath={getSafeNextPath(params.next)}
    />
  )
}
