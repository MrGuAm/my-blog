import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAuthenticatedServer } from "@/lib/server/auth"
import { canWriteMediaLibrary, getMediaLibraryWarning, listMediaAssets } from "@/lib/server/media"
import { getSiteSettings } from "@/lib/server/site-settings"
import { siteConfig } from "@/lib/site-config"
import AdminMediaClient from "./AdminMediaClient"

export const metadata: Metadata = {
  title: "媒体库",
  description: `${siteConfig.name} 媒体素材管理`,
}

export default async function AdminMediaPage() {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/admin/media")
  }

  const [assets, siteSettings] = await Promise.all([listMediaAssets(), getSiteSettings()])
  return (
    <AdminMediaClient
      initialAssets={assets}
      initialWarning={getMediaLibraryWarning()}
      initialCanUpload={canWriteMediaLibrary()}
      brandName={siteSettings.brandName}
    />
  )
}
