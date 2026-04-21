import type { MetadataRoute } from "next"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"

function createShortName(name: string) {
  const trimmed = name.trim()
  return trimmed.length <= 12 ? trimmed : `${trimmed.slice(0, 11)}…`
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getResolvedSeoSettings()

  return {
    name: settings.brandName,
    short_name: createShortName(settings.brandName),
    description: settings.siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbfd",
    theme_color: "#6C3FF5",
    lang: "zh-CN",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
