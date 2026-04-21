import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"
import { getSiteSettings } from "@/lib/server/site-settings"
import MusicPageClient from "./MusicPageClient"

export const metadata: Metadata = {
  title: "音乐",
  description: `${siteConfig.name} 的音乐角落`,
  openGraph: {
    title: `音乐 | ${siteConfig.name}`,
    description: `${siteConfig.name} 的音乐角落`,
  },
}

export default async function MusicPage() {
  const siteSettings = await getSiteSettings()
  return <MusicPageClient brandName={siteSettings.brandName} />
}
