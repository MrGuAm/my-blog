import type { Metadata } from "next"
import Link from "next/link"
import { getAllTags, getPostsByTag } from "@/lib/posts"

export const metadata: Metadata = {
  title: "全部标签",
  description: "浏览 Champion's Blog 的全部内容标签",
}

export default async function TagsPage() {
  const tags = await getAllTags()
  const tagSummaries = await Promise.all(
    tags.map(async (tag) => ({
      tag,
      count: (await getPostsByTag(tag)).length,
    }))
  )

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#6C3FF5]/60">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-lg font-black">全部标签</span>
          </div>
          <Link href="/home" className="text-sm text-muted-foreground transition-colors hover:text-primary">Home</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">内容标签</h1>
          <p className="mt-2 text-muted-foreground">按主题快速发现你感兴趣的内容。</p>
        </header>

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
      </div>
    </div>
  )
}
