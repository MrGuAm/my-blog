import { getAllPosts } from "@/lib/posts"
import { absoluteUrl, siteConfig } from "@/lib/site-config"

export async function GET() {
  const posts = (await getAllPosts()).filter((post) => !post.draft)

  const items = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${absoluteUrl(`/posts/${post.slug || post.id}`)}</link>
      <guid>${absoluteUrl(`/posts/${post.slug || post.id}`)}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category>${post.category}</category>
      ${post.tags.map(tag => `<category>${tag}</category>`).join('\n      ')}
    </item>
  `).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.name}</title>
    <link>${siteConfig.url}</link>
    <description>${siteConfig.description}</description>
    <language>${siteConfig.language}</language>
    <atom:link href="${absoluteUrl(siteConfig.rssPath)}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  })
}
