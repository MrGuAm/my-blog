import type { Metadata } from "next"
import Link from "next/link"
import SectionPageShell from "@/components/SectionPageShell"
import type { Post } from "@/lib/posts"
import { getAllPosts } from "@/lib/posts"
import { parseHomeQueryState } from "@/lib/home-query"
import { filterPostsForListing, getPostSearchMatchScope, splitHighlightedText } from "@/lib/post-search"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"

export const revalidate = 300

interface SearchPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function renderHighlightedText(text: string, query: string) {
  return splitHighlightedText(text, query).map((part, index) =>
    part.match ? (
      <mark key={`${text}-${index}`} className="rounded bg-[#ffe1b3]/80 px-1 text-foreground">
        {part.text}
      </mark>
    ) : (
      <span key={`${text}-${index}`}>{part.text}</span>
    )
  )
}

function buildSearchHref(searchQuery: string, selectedTag: string | null, page: number) {
  const params = new URLSearchParams()
  if (searchQuery.trim()) params.set("q", searchQuery.trim())
  if (selectedTag) params.set("tag", selectedTag)
  if (page > 1) params.set("page", String(page))
  const next = params.toString()
  return next ? `/search?${next}` : "/search"
}

function SearchResultCard({ post, searchQuery }: { post: Post; searchQuery: string }) {
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

  return (
    <article className="rounded-[1.75rem] border border-border/50 bg-card p-5 transition-colors hover:bg-accent/20">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="apple-pill">{renderHighlightedText(post.category, searchQuery)}</span>
        <span className="text-xs text-muted-foreground">{post.date}</span>
        {post.series ? (
          <Link href={`/series/${encodeURIComponent(post.series)}`} className="apple-pill">
            系列：{renderHighlightedText(post.series, searchQuery)}
            {post.seriesOrder ? ` · 第 ${post.seriesOrder} 篇` : ""}
          </Link>
        ) : null}
        {showContentMatch ? <span className="apple-pill">正文命中</span> : null}
      </div>
      <Link href={postHref} className="block">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
          {renderHighlightedText(post.title, searchQuery)}
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {renderHighlightedText(post.excerpt, searchQuery)}
        </p>
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Link key={tag} href={buildSearchHref(searchQuery, tag, 1)} className="apple-pill hover:bg-white dark:hover:bg-white/12">
            #{renderHighlightedText(tag, searchQuery)}
          </Link>
        ))}
      </div>
    </article>
  )
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const [settings, state] = await Promise.all([
    getResolvedSeoSettings(),
    parseHomeQueryState((await searchParams) || {}),
  ])

  if (state.searchQuery) {
    return {
      title: `搜索：${state.searchQuery}`,
      description: `查看 ${settings.brandName} 中与 “${state.searchQuery}” 相关的内容`,
    }
  }

  return {
    title: "搜索",
    description: `在 ${settings.brandName} 中搜索文章、标签和系列`,
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const state = parseHomeQueryState((await searchParams) || {})
  const [posts, siteSettings] = await Promise.all([
    getAllPosts({ includeDrafts: false, cached: true }),
    getSiteSettings(),
  ])

  const filteredPosts = filterPostsForListing(posts, {
    includeDrafts: false,
    searchQuery: state.searchQuery,
    selectedTag: state.selectedTag,
  })

  const postsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage))
  const safeCurrentPage = Math.min(state.currentPage, totalPages)
  const paginatedPosts = filteredPosts.slice((safeCurrentPage - 1) * postsPerPage, safeCurrentPage * postsPerPage)

  return (
    <SectionPageShell
      navLabel="搜索"
      activeNav="home"
      brandLabel={siteSettings.brandName}
      title="搜索内容"
      description="按关键词、标签和系列快速定位你要找的文章。"
      backLinkHref="/home"
      backLinkLabel="← 返回首页"
      headerActions={
        <form action="/search" className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            name="q"
            defaultValue={state.searchQuery}
            placeholder="搜索文章、标签、系列或正文..."
            className="apple-input w-full sm:min-w-[20rem]"
          />
          {state.selectedTag ? <input type="hidden" name="tag" value={state.selectedTag} /> : null}
          <button type="submit" className="brand-solid-button whitespace-nowrap px-5 py-2.5">
            搜索
          </button>
        </form>
      }
    >
      {state.searchQuery || state.selectedTag ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>共找到 {filteredPosts.length} 篇结果</span>
          {state.searchQuery ? <span className="apple-pill">关键词：{state.searchQuery}</span> : null}
          {state.selectedTag ? (
            <>
              <span className="apple-pill">标签：#{state.selectedTag}</span>
              <Link href={buildSearchHref(state.searchQuery, null, 1)} className="text-primary hover:underline">
                清除标签筛选
              </Link>
            </>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-border/50 bg-card p-8 text-center text-muted-foreground">
          输入关键词开始搜索，支持标题、摘要、分类、标签、系列和正文内容。
        </div>
      )}

      {state.searchQuery || state.selectedTag ? (
        paginatedPosts.length > 0 ? (
          <div className="space-y-4">
            {paginatedPosts.map((post) => (
              <SearchResultCard key={post.id} post={post} searchQuery={state.searchQuery} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-border/50 bg-card p-8 text-center text-muted-foreground">
            没有找到匹配的文章，试试换个关键词或标签。
          </div>
        )
      ) : null}

      {filteredPosts.length > postsPerPage ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={buildSearchHref(state.searchQuery, state.selectedTag, Math.max(1, safeCurrentPage - 1))}
            aria-disabled={safeCurrentPage === 1}
            className={`rounded-xl border border-border/60 px-4 py-2 text-sm ${
              safeCurrentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"
            }`}
          >
            上一页
          </Link>
          <span className="text-sm text-muted-foreground">第 {safeCurrentPage} / {totalPages} 页</span>
          <Link
            href={buildSearchHref(state.searchQuery, state.selectedTag, Math.min(totalPages, safeCurrentPage + 1))}
            aria-disabled={safeCurrentPage === totalPages}
            className={`rounded-xl border border-border/60 px-4 py-2 text-sm ${
              safeCurrentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"
            }`}
          >
            下一页
          </Link>
        </div>
      ) : null}
    </SectionPageShell>
  )
}
