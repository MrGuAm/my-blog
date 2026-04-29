import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { parseMediaQueryState } from "@/lib/media-query"
import { isAuthenticatedServer } from "@/lib/server/auth"
import SectionPageShell from "@/components/SectionPageShell"
import { canWriteMediaLibrary, getMediaLibraryWarning as getImageLibraryWarning, listMediaAssets } from "@/lib/server/media"
import {
  canUseDirectBlobMusicUpload,
  canWriteMusicLibrary,
  getMusicLibraryWarning,
  listMusicLibraryTracks,
} from "@/lib/server/music"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"
import AdminMediaClient from "./AdminMediaClient"
import AdminMusicClient from "../music/AdminMusicClient"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "素材库",
    description: `${settings.brandName} 图片与音乐素材管理`,
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

  const resolvedSearchParams = (await searchParams) || {}
  const rawTab = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab
  const activeTab = rawTab === "music" ? "music" : "images"
  const state = parseMediaQueryState(resolvedSearchParams)
  const [assets, tracks, siteSettings] = await Promise.all([
    listMediaAssets(),
    listMusicLibraryTracks(),
    getSiteSettings(),
  ])
  const imageTabHref = "/admin/media"
  const musicTabHref = "/admin/media?tab=music"

  return (
    <SectionPageShell
      navLabel="素材库"
      activeNav="media"
      brandLabel={siteSettings.brandName}
      title="素材库"
      description="把图片素材和在线曲库收在一个后台入口里，减少菜单层级，也更方便集中管理。"
      headerActions={
        <div className="flex flex-wrap gap-2 rounded-full border border-border/50 bg-card p-1">
          <Link
            href={imageTabHref}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "images" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            图片素材
          </Link>
          <Link
            href={musicTabHref}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "music" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            在线曲库
          </Link>
        </div>
      }
    >
      {activeTab === "music" ? (
          <AdminMusicClient
            initialTracks={tracks}
            initialWarning={getMusicLibraryWarning()}
            initialCanUpload={canWriteMusicLibrary()}
            directBlobUploadEnabled={canUseDirectBlobMusicUpload()}
            brandName={siteSettings.brandName}
            embedded
          />
        ) : (
          <AdminMediaClient
            initialAssets={assets}
            initialWarning={getImageLibraryWarning()}
            initialCanUpload={canWriteMediaLibrary()}
            brandName={siteSettings.brandName}
            initialKeyword={state.keyword}
            initialTimeFilter={state.timeFilter}
            initialStorageFilter={state.storageFilter}
            initialFormatFilter={state.formatFilter}
            initialOrientationFilter={state.orientationFilter}
            initialUsageFilter={state.usageFilter}
            initialUsageKindFilter={state.usageKindFilter}
            initialSortBy={state.sortBy}
            initialPage={state.currentPage}
            embedded
          />
        )}
    </SectionPageShell>
  )
}
