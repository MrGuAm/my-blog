import type { Metadata } from "next"
import Link from "next/link"
import SectionPageShell from "@/components/SectionPageShell"
import { calculateReadingTime, getAllSeries, getPostsBySeries } from "@/lib/posts"
import { getSiteSettings } from "@/lib/server/site-settings"
import { siteConfig } from "@/lib/site-config"

interface SeriesPageProps {
  params: Promise<{ series: string }>
}

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { series } = await params
  const decodedSeries = decodeURIComponent(series)
  return {
    title: `${decodedSeries}`,
    description: `查看系列 ${decodedSeries} 下的所有文章`,
    openGraph: {
      title: `${decodedSeries} | ${siteConfig.name}`,
      description: `查看系列 ${decodedSeries} 下的所有文章`,
    },
  }
}

export async function generateStaticParams() {
  const seriesList = await getAllSeries()
  return seriesList.map((series) => ({ series }))
}

export default async function SeriesDetailPage({ params }: SeriesPageProps) {
  const { series } = await params
  const decodedSeries = decodeURIComponent(series)
  const [posts, siteSettings] = await Promise.all([getPostsBySeries(decodedSeries), getSiteSettings()])
  const featuredCount = posts.filter((post) => post.featured).length
  const totalReadingTime = posts.reduce((sum, post) => sum + calculateReadingTime(post.content), 0)
  const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0)
  const firstPost = posts[0]
  const latestPost = [...posts].sort(
    (a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime()
  )[0]

  return (
    <SectionPageShell
      navLabel="系列聚合"
      brandLabel={siteSettings.brandName}
      navActions={<Link href="/series" className="text-sm text-muted-foreground transition-colors hover:text-primary">全部系列</Link>}
      backLinkHref="/series"
      backLinkLabel="← 返回全部系列"
      headerTop={<span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{decodedSeries}</span>}
      title={`系列：${decodedSeries}`}
      description={`共找到 ${posts.length} 篇系列文章，适合按顺序连续阅读。`}
      headerActions={
        firstPost ? (
          <div className="grid min-w-[260px] grid-cols-2 gap-3 sm:min-w-[360px]">
            <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">系列进度</p>
              <p className="mt-1 text-lg font-black tracking-tight">{posts.length} 篇 / {totalReadingTime} 分钟</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">系列表现</p>
              <p className="mt-1 text-lg font-black tracking-tight">{totalViews} 阅读 / {featuredCount} 精选</p>
            </div>
            <Link
              href={`/posts/${firstPost.slug || firstPost.id}`}
              className="rounded-2xl border border-border/50 bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/20"
            >
              <p className="text-xs text-muted-foreground">从第一篇开始</p>
              <p className="mt-1 truncate font-semibold">{firstPost.title}</p>
            </Link>
            <Link
              href={`/posts/${(latestPost || firstPost).slug || (latestPost || firstPost).id}`}
              className="rounded-2xl border border-border/50 bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/20"
            >
              <p className="text-xs text-muted-foreground">先看最新一篇</p>
              <p className="mt-1 truncate font-semibold">{(latestPost || firstPost).title}</p>
            </Link>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={post.id} className="grid gap-3 md:grid-cols-[auto_1fr] md:gap-4">
              <div className="hidden md:flex md:flex-col md:items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
                  {typeof post.seriesOrder === "number" ? post.seriesOrder : index + 1}
                </div>
                {index < posts.length - 1 ? <div className="mt-2 h-full w-px min-h-12 bg-border/70" /> : null}
              </div>
              <Link
                href={`/posts/${post.slug || post.id}`}
                className="group block rounded-[1.75rem] border border-border/50 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/20"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs">{post.category}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    第 {typeof post.seriesOrder === "number" ? post.seriesOrder : index + 1} 篇
                  </span>
                  {post.featured ? (
                    <span className="rounded-full bg-[#ffb98f]/20 px-2 py-0.5 text-xs text-[#c46d35]">精选</span>
                  ) : null}
                  <span>{post.date}</span>
                  <span>{calculateReadingTime(post.content)} 分钟</span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold transition-colors group-hover:text-primary">{post.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  </div>
                  <div className="shrink-0 rounded-2xl bg-background/70 px-4 py-3 text-right text-xs text-muted-foreground">
                    <p>阅读量</p>
                    <p className="mt-1 text-base font-semibold text-foreground/85">{post.views || 0}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
            这个系列下还没有文章。
          </div>
        )}
      </div>
    </SectionPageShell>
  )
}
