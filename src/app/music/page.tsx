import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"
import MusicPageClient from "./MusicPageClient"

export const metadata: Metadata = {
  title: "音乐",
  description: `${siteConfig.name} 的音乐角落`,
  openGraph: {
    title: `音乐 | ${siteConfig.name}`,
    description: `${siteConfig.name} 的音乐角落`,
  },
}

export default function MusicPage() {
  return <MusicPageClient />
}
