import type { Metadata } from "next"
import Link from "next/link"
import SectionPageShell from "@/components/SectionPageShell"
import { getAllSeries, getPostsBySeries } from "@/lib/posts"
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
  const posts = await getPostsBySeries(decodedSeries)

  return (
    <SectionPageShell
      navLabel="系列聚合"
      navActions={<Link href="/series" className="text-sm text-muted-foreground transition-colors hover:text-primary">全部系列</Link>}
      backLinkHref="/series"
      backLinkLabel="← 返回全部系列"
      headerTop={<span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{decodedSeries}</span>}
      title={`系列：${decodedSeries}`}
      description={`共找到 ${posts.length} 篇系列文章。`}
    >
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug || post.id}`}
              className="block rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-primary/50 hover:bg-accent/20"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs">{post.category}</span>
                {typeof post.seriesOrder === "number" ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">第 {post.seriesOrder} 篇</span>
                ) : null}
                <span>{post.date}</span>
              </div>
              <h2 className="text-xl font-bold transition-colors hover:text-primary">{post.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
            </Link>
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
