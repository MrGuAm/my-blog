import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAuthenticatedServer } from "@/lib/server/auth"
import { getMediaLibraryWarning, listMediaAssets } from "@/lib/server/media"
import AdminMediaClient from "./AdminMediaClient"

export const metadata: Metadata = {
  title: "媒体库",
  description: "Champion's Blog 媒体素材管理",
}

export default async function AdminMediaPage() {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/admin/media")
  }

  const assets = await listMediaAssets()
  return <AdminMediaClient initialAssets={assets} initialWarning={getMediaLibraryWarning()} />
}
