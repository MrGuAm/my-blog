import type { Metadata } from "next"
import type { Post } from "@/lib/posts"
import { siteConfig } from "@/lib/site-config"
import { getSiteSettings } from "./site-settings"

function normalizeKeywords(value: string) {
  const keywords = value
    .split(/[\n,，]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  return keywords.length > 0 ? keywords : [...siteConfig.keywords]
}

function buildBrandIconDataUri(label: string) {
  const mark = (label.trim().charAt(0) || "C").toUpperCase()
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%236C3FF5'/%3E%3Ctext x='50' y='68' font-size='55' font-family='Arial' font-weight='bold' text-anchor='middle' fill='white'%3E${encodeURIComponent(mark)}%3C/text%3E%3C/svg%3E`
}

function toAbsoluteUrl(url?: string) {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  const normalizedPath = url.startsWith("/") ? url : `/${url}`
  return new URL(normalizedPath, siteConfig.url).toString()
}

export async function getResolvedSeoSettings() {
  const settings = await getSiteSettings()
  return {
    ...settings,
    normalizedKeywords: normalizeKeywords(settings.seoKeywords),
    titleTemplate: `%s | ${settings.brandName}`,
    iconDataUri: buildBrandIconDataUri(settings.brandName),
  }
}

export async function buildWebsiteStructuredData() {
  const settings = await getResolvedSeoSettings()
  const sameAs = [settings.githubUrl, settings.xProfileUrl, settings.primaryLinkUrl].filter(Boolean)
  const personId = `${siteConfig.url}#person`
  const websiteId = `${siteConfig.url}#website`

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteId,
      name: settings.brandName,
      description: settings.siteDescription,
      url: siteConfig.url,
      inLanguage: siteConfig.language,
      author: { "@id": personId },
      publisher: { "@id": personId },
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": personId,
      name: settings.authorName,
      url: siteConfig.url,
      description: settings.siteDescription,
      ...(sameAs.length > 0 ? { sameAs } : {}),
      ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    },
  ]
}

export async function buildAboutStructuredData() {
  const settings = await getResolvedSeoSettings()
  const sameAs = [settings.githubUrl, settings.xProfileUrl, settings.primaryLinkUrl].filter(Boolean)

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: settings.authorName,
      description: settings.aboutDescription,
      url: `${siteConfig.url}/about`,
      ...(sameAs.length > 0 ? { sameAs } : {}),
      ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    },
  }
}

export async function buildBlogPostingStructuredData(post: Post) {
  const settings = await getResolvedSeoSettings()
  const canonicalUrl = `${siteConfig.url}/posts/${post.slug || post.id}`
  const imageUrl = toAbsoluteUrl(post.coverImage) || toAbsoluteUrl(siteConfig.ogImage)

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    author: {
      "@type": "Person",
      name: settings.authorName,
    },
    publisher: {
      "@type": "Person",
      name: settings.authorName,
    },
    image: imageUrl ? [imageUrl] : undefined,
    keywords: post.tags.join(", "),
    articleSection: post.category,
    isPartOf: {
      "@type": "WebSite",
      name: settings.brandName,
      url: siteConfig.url,
    },
    ...(typeof post.seriesOrder === "number" ? { position: post.seriesOrder } : {}),
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
    keywords: settings.normalizedKeywords,
    authors: [{ name: settings.authorName }],
    creator: settings.authorName,
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
      creator: settings.twitterHandle,
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
