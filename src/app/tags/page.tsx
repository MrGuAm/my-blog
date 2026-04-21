import type { Metadata } from "next"
import Link from "next/link"
import SectionPageShell from "@/components/SectionPageShell"
import { getAllTags, getPostsByTag } from "@/lib/posts"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "全部标签",
    description: `浏览 ${settings.brandName} 的全部内容标签`,
  }
}

export default async function TagsPage() {
  const [tags, siteSettings] = await Promise.all([getAllTags(), getSiteSettings()])
  const tagSummaries = await Promise.all(
    tags.map(async (tag) => ({
      tag,
      count: (await getPostsByTag(tag)).length,
    }))
  )

  return (
    <SectionPageShell
      navLabel="全部标签"
      activeNav="tags"
      brandLabel={siteSettings.brandName}
      title="内容标签"
      description="按主题快速发现你感兴趣的内容。"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tagSummaries.map(({ tag, count }) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="rounded-2xl border border-border/50 bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/20"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-semibold">#{tag}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{count} 篇</span>
            </div>
          </Link>
        ))}
      </div>
    </SectionPageShell>
  )
}
