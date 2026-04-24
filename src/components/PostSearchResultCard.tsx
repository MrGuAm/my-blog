"use client"

import Link from "next/link"
import type { Post } from "@/lib/posts"
import { getPostSearchMatchScope } from "@/lib/post-search"
import type { SearchViewMode } from "@/lib/search-query"
import HighlightedText from "@/components/HighlightedText"

interface PostSearchResultCardProps {
  post: Post
  searchQuery: string
  tagHrefs: Record<string, string>
  viewMode?: SearchViewMode
}

export default function PostSearchResultCard({
  post,
  searchQuery,
  tagHrefs,
  viewMode = "cards",
}: PostSearchResultCardProps) {
  const postHref = `/posts/${post.slug || post.id}`
  const matchScope = getPostSearchMatchScope(post, searchQuery)
  const showContentMatch =
    Boolean(searchQuery.trim()) &&
    matchScope.content &&
    !matchScope.title &&
    !matchScope.excerpt &&
    !matchScope.category &&
    !matchScope.series &&
    !matchScope.tags

  if (viewMode === "compact") {
    return (
      <article className="rounded-[1.5rem] border border-border/50 bg-card px-4 py-4 transition-colors hover:bg-accent/20">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="apple-pill">
            <HighlightedText text={post.category} query={searchQuery} />
          </span>
          <span className="text-xs text-muted-foreground">{post.date}</span>
          {showContentMatch ? <span className="apple-pill">正文命中</span> : null}
        </div>
        <Link href={postHref} className="block">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
            <HighlightedText text={post.title} query={searchQuery} />
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <HighlightedText text={post.excerpt} query={searchQuery} />
          </p>
        </Link>
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={tagHrefs[tag] || "#"}
              className="apple-pill hover:bg-white dark:hover:bg-white/12"
            >
              #<HighlightedText text={tag} query={searchQuery} />
            </Link>
          ))}
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-[1.75rem] border border-border/50 bg-card p-5 transition-colors hover:bg-accent/20">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="apple-pill">
          <HighlightedText text={post.category} query={searchQuery} />
        </span>
        <span className="text-xs text-muted-foreground">{post.date}</span>
        {post.series ? (
          <Link href={`/series/${encodeURIComponent(post.series)}`} className="apple-pill">
            系列：<HighlightedText text={post.series} query={searchQuery} />
            {post.seriesOrder ? ` · 第 ${post.seriesOrder} 篇` : ""}
          </Link>
        ) : null}
        {showContentMatch ? <span className="apple-pill">正文命中</span> : null}
      </div>
      <Link href={postHref} className="block">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
          <HighlightedText text={post.title} query={searchQuery} />
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          <HighlightedText text={post.excerpt} query={searchQuery} />
        </p>
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Link
            key={tag}
            href={tagHrefs[tag] || "#"}
            className="apple-pill hover:bg-white dark:hover:bg-white/12"
          >
            #<HighlightedText text={tag} query={searchQuery} />
          </Link>
        ))}
      </div>
    </article>
  )
}
