import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAuthenticatedServer } from "@/lib/server/auth"
import { canUseDirectBlobMusicUpload, canWriteMusicLibrary, getMusicLibraryWarning, listMusicLibraryTracks } from "@/lib/server/music"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"
import AdminMusicClient from "./AdminMusicClient"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "在线曲库",
    description: `${settings.brandName} 音乐上传与曲库管理`,
  }
}

export default async function AdminMusicPage() {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/admin/music")
  }

  const [tracks, siteSettings] = await Promise.all([listMusicLibraryTracks(), getSiteSettings()])

  return (
    <AdminMusicClient
      initialTracks={tracks}
      initialWarning={getMusicLibraryWarning()}
      initialCanUpload={canWriteMusicLibrary()}
      directBlobUploadEnabled={canUseDirectBlobMusicUpload()}
      brandName={siteSettings.brandName}
    />
  )
}
