import type { Metadata } from "next"
import Link from "next/link"
import SectionPageShell from "@/components/SectionPageShell"
import { getAllSeries, getPostsBySeries } from "@/lib/posts"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "全部系列",
  description: `浏览 ${siteConfig.name} 的全部文章系列`,
}

export default async function SeriesPage() {
  const seriesList = await getAllSeries()
  const seriesSummaries = await Promise.all(
    seriesList.map(async (series) => ({
      series,
      count: (await getPostsBySeries(series)).length,
    }))
  )

  return (
    <SectionPageShell
      navLabel="全部系列"
      title="文章系列"
      description="按系列阅读内容，比按时间线更容易连贯地看下去。"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {seriesSummaries.map(({ series, count }) => (
          <Link
            key={series}
            href={`/series/${encodeURIComponent(series)}`}
            className="rounded-2xl border border-border/50 bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/20"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-semibold">{series}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{count} 篇</span>
            </div>
          </Link>
        ))}
      </div>
    </SectionPageShell>
  )
}
