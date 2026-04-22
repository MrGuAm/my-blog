import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { parseMediaQueryState } from "@/lib/media-query"
import { isAuthenticatedServer } from "@/lib/server/auth"
import { canWriteMediaLibrary, getMediaLibraryWarning, listMediaAssets } from "@/lib/server/media"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"
import AdminMediaClient from "./AdminMediaClient"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "媒体库",
    description: `${settings.brandName} 媒体素材管理`,
  }
}

interface AdminMediaPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminMediaPage({ searchParams }: AdminMediaPageProps) {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/admin/media")
  }

  const [assets, siteSettings] = await Promise.all([listMediaAssets(), getSiteSettings()])
  const state = parseMediaQueryState((await searchParams) || {})
  return (
    <AdminMediaClient
      initialAssets={assets}
      initialWarning={getMediaLibraryWarning()}
      initialCanUpload={canWriteMediaLibrary()}
      brandName={siteSettings.brandName}
      initialKeyword={state.keyword}
      initialTimeFilter={state.timeFilter}
      initialSortBy={state.sortBy}
    />
  )
}
