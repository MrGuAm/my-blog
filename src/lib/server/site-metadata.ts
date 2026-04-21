import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"
import { getSiteSettings } from "./site-settings"

function buildBrandIconDataUri(label: string) {
  const mark = (label.trim().charAt(0) || "C").toUpperCase()
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%236C3FF5'/%3E%3Ctext x='50' y='68' font-size='55' font-family='Arial' font-weight='bold' text-anchor='middle' fill='white'%3E${encodeURIComponent(mark)}%3C/text%3E%3C/svg%3E`
}

export async function getResolvedSeoSettings() {
  const settings = await getSiteSettings()
  return {
    ...settings,
    titleTemplate: `%s | ${settings.brandName}`,
    iconDataUri: buildBrandIconDataUri(settings.brandName),
  }
}

export async function buildRootMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: settings.brandName,
      template: settings.titleTemplate,
    },
    description: settings.siteDescription,
    keywords: [...siteConfig.keywords],
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.author,
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: siteConfig.url,
      siteName: settings.brandName,
      title: settings.brandName,
      description: settings.siteDescription,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: settings.brandName }],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.brandName,
      description: settings.siteDescription,
      images: [siteConfig.ogImage],
      creator: siteConfig.twitterHandle,
    },
    icons: {
      icon: settings.iconDataUri,
    },
    alternates: {
      types: {
        "application/rss+xml": siteConfig.rssPath,
      },
    },
  }
}
