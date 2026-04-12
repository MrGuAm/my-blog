import type { Metadata } from "next"
import Link from "next/link"
import { getAllTags, getPostsByTag } from "@/lib/posts"

interface TagPageProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  return {
    title: `#${decodedTag}`,
    description: `查看标签 ${decodedTag} 下的所有文章`,
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
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#6C3FF5]/60">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-lg font-black">标签聚合</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/home" className="text-sm text-muted-foreground transition-colors hover:text-primary">Home</Link>
            <Link href="/tags" className="text-sm text-muted-foreground transition-colors hover:text-primary">全部标签</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/home" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
          ← 返回首页
        </Link>

        <header className="mb-8">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">#{decodedTag}</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight">标签：{decodedTag}</h1>
          <p className="mt-2 text-muted-foreground">共找到 {posts.length} 篇相关文章。</p>
        </header>

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
      </div>
    </div>
  )
}
