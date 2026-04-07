import { getAllPosts } from "@/lib/posts"
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().filter(p => !p.draft)
  const baseUrl = "https://my-blog-amber-chi.vercel.app"

  const postEntries = posts.map(post => ({
    url: `${baseUrl}/posts/${post.id}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: post.pinned ? 0.8 : 0.6
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    },
    ...postEntries
  ]
}