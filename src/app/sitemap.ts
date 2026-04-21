import { getAllPosts } from "@/lib/posts"
import { absoluteUrl, siteConfig } from "@/lib/site-config"
import type { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = (await getAllPosts()).filter((post) => !post.draft)

  const postEntries = posts.map(post => ({
    url: absoluteUrl(`/posts/${post.slug || post.id}`),
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: post.pinned ? 0.8 : 0.6
  }))

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0
    },
    {
      url: absoluteUrl("/home"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: absoluteUrl("/about"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    },
    ...postEntries
  ]
}
