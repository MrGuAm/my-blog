import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAuthenticatedServer } from "@/lib/server/auth"
import { getSiteSettings } from "@/lib/server/site-settings"
import { siteConfig } from "@/lib/site-config"
import AdminSettingsClient from "./AdminSettingsClient"

export const metadata: Metadata = {
  title: "站点设置",
  description: `${siteConfig.name} 站点文案与品牌设置`,
}

export default async function AdminSettingsPage() {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/admin/settings")
  }

  const settings = await getSiteSettings()
  return <AdminSettingsClient initialSettings={settings} />
}
