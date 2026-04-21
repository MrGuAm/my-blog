import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"
import { getSiteSettings } from "@/lib/server/site-settings"
import AboutClient from "./AboutClient"

export const metadata: Metadata = {
  title: "关于",
  description: `关于 ${siteConfig.name} - 这是一个分享生活和技术的个人博客`,
  openGraph: {
    title: `关于 | ${siteConfig.name}`,
    description: `关于 ${siteConfig.name} - 这是一个分享生活和技术的个人博客`,
  },
}

export default async function AboutPage() {
  const siteSettings = await getSiteSettings()
  return <AboutClient siteSettings={siteSettings} />
}
