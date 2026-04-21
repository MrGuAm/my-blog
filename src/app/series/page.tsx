import type { Metadata } from "next"
import Link from "next/link"
import SectionPageShell from "@/components/SectionPageShell"
import { getSeriesSummaries } from "@/lib/posts"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "全部系列",
    description: `浏览 ${settings.brandName} 的全部文章系列`,
  }
}

export default async function SeriesPage() {
  const [seriesSummaries, siteSettings] = await Promise.all([getSeriesSummaries(), getSiteSettings()])

  return (
    <SectionPageShell
      navLabel="全部系列"
      brandLabel={siteSettings.brandName}
      title="文章系列"
      description="按系列阅读内容，比按时间线更容易连贯地看下去。"
      headerActions={
        seriesSummaries.length > 0 ? (
          <div className="grid min-w-[220px] grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">系列数量</p>
              <p className="mt-1 text-2xl font-black tracking-tight">{seriesSummaries.length}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">系列文章</p>
              <p className="mt-1 text-2xl font-black tracking-tight">
                {seriesSummaries.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
          </div>
        ) : null
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {seriesSummaries.map(({ series, count, featuredCount, totalReadingTime, totalViews, firstPost, latestPost }) => (
          <Link
            key={series}
            href={`/series/${encodeURIComponent(series)}`}
            className="group rounded-[1.75rem] border border-border/50 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/20"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-semibold tracking-[-0.02em]">{series}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{count} 篇</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {firstPost ? `从《${firstPost.title}》开始，` : ""}预计 {totalReadingTime} 分钟读完，
              {featuredCount > 0 ? `其中 ${featuredCount} 篇被标记为精选。` : "适合按顺序慢慢读下去。"}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="rounded-2xl bg-background/70 px-3 py-2">
                <p>阅读量</p>
                <p className="mt-1 font-semibold text-foreground/85">{totalViews}</p>
              </div>
              <div className="rounded-2xl bg-background/70 px-3 py-2">
                <p>精选</p>
                <p className="mt-1 font-semibold text-foreground/85">{featuredCount}</p>
              </div>
              <div className="rounded-2xl bg-background/70 px-3 py-2">
                <p>更新</p>
                <p className="mt-1 font-semibold text-foreground/85">
                  {latestPost ? new Date(latestPost.updatedAt || latestPost.date).toLocaleDateString("zh-CN") : "—"}
                </p>
              </div>
            </div>
            {firstPost ? (
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">起始文章：{firstPost.title}</span>
                <span className="font-medium text-foreground/80 transition-transform group-hover:translate-x-0.5">
                  开始阅读 →
                </span>
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </SectionPageShell>
  )
}
