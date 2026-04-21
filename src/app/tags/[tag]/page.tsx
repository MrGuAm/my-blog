import type { Metadata } from "next"
import Link from "next/link"
import SectionPageShell from "@/components/SectionPageShell"
import { getAllTags, getPostsByTag } from "@/lib/posts"
import { siteConfig } from "@/lib/site-config"

interface TagPageProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  return {
    title: `#${decodedTag}`,
    description: `查看标签 ${decodedTag} 下的所有文章`,
    openGraph: {
      title: `#${decodedTag} | ${siteConfig.name}`,
      description: `查看标签 ${decodedTag} 下的所有文章`,
    },
  }
}

export async function generateStaticParams() {
  const tags = await getAllTags()
  return tags.map((tag) => ({ tag }))
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const posts = await getPostsByTag(decodedTag)

  return (
    <SectionPageShell
      navLabel="标签聚合"
      activeNav="tags"
      navActions={<Link href="/tags" className="text-sm text-muted-foreground transition-colors hover:text-primary">全部标签</Link>}
      backLinkHref="/home"
      backLinkLabel="← 返回首页"
      headerTop={<span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">#{decodedTag}</span>}
      title={`标签：${decodedTag}`}
      description={`共找到 ${posts.length} 篇相关文章。`}
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
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.tags.length} 个标签</span>
              </div>
              <h2 className="text-xl font-bold transition-colors hover:text-primary">{post.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
            这个标签下还没有文章。
          </div>
        )}
      </div>
    </SectionPageShell>
  )
}
