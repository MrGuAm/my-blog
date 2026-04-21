import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAuthenticatedServer } from "@/lib/server/auth"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"
import AdminSettingsClient from "./AdminSettingsClient"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "站点设置",
    description: `${settings.brandName} 站点文案与品牌设置`,
  }
}

export default async function AdminSettingsPage() {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/admin/settings")
  }

  const settings = await getSiteSettings()
  return <AdminSettingsClient initialSettings={settings} />
}
