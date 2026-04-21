import type { Metadata } from "next"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"
import MusicPageClient from "./MusicPageClient"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "音乐",
    description: settings.musicMetaDescription,
    openGraph: {
      title: `音乐 | ${settings.brandName}`,
      description: settings.musicMetaDescription,
    },
  }
}

export default async function MusicPage() {
  const siteSettings = await getSiteSettings()
  return <MusicPageClient brandName={siteSettings.brandName} />
}
