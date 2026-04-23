import type { Metadata } from "next"
import Link from "next/link"
import HighlightedText from "@/components/HighlightedText"
import PostSearchResultCard from "@/components/PostSearchResultCard"
import SectionPageShell from "@/components/SectionPageShell"
import type { Post } from "@/lib/posts"
import { getAllPosts, getAllSeries, getAllTags } from "@/lib/posts"
import { filterPostsForListing, getPostCategoryBreakdown, sortSearchResults } from "@/lib/post-search"
import { buildSearchHref, parseSearchQueryState } from "@/lib/search-query"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"

export const revalidate = 300

interface SearchPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getPopularTags(posts: Post[], tags: string[]) {
  return [...tags]
    .map((tag) => ({
      tag,
      count: posts.filter((post) => post.tags.includes(tag)).length,
    }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag, "zh-CN"))
    .slice(0, 6)
}

function getPopularSeries(posts: Post[], series: string[]) {
  return [...series]
    .map((seriesName) => ({
      series: seriesName,
      count: posts.filter((post) => post.series === seriesName).length,
    }))
    .sort((left, right) => right.count - left.count || left.series.localeCompare(right.series, "zh-CN"))
    .slice(0, 4)
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const [settings, state] = await Promise.all([
    getResolvedSeoSettings(),
    parseSearchQueryState((await searchParams) || {}),
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
  const state = parseSearchQueryState((await searchParams) || {})
  const [posts, allTags, allSeries, siteSettings] = await Promise.all([
    getAllPosts({ includeDrafts: false, cached: true }),
    getAllTags(),
    getAllSeries(),
    getSiteSettings(),
  ])

  const filteredPosts = filterPostsForListing(posts, {
    includeDrafts: false,
    searchQuery: state.searchQuery,
    selectedTag: state.selectedTag,
    selectedCategory: state.selectedCategory,
  })
  const sortedPosts = sortSearchResults(filteredPosts, state.sortBy)

  const postsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / postsPerPage))
  const safeCurrentPage = Math.min(state.currentPage, totalPages)
  const paginatedPosts = sortedPosts.slice((safeCurrentPage - 1) * postsPerPage, safeCurrentPage * postsPerPage)
  const popularTags = getPopularTags(posts, allTags)
  const popularSeries = getPopularSeries(posts, allSeries)
  const featuredPosts = posts.filter((post) => post.featured).slice(0, 3)
  const allCategories = Array.from(new Set(posts.map((post) => post.category))).sort((left, right) => left.localeCompare(right, "zh-CN"))
  const categoryBreakdown = getPostCategoryBreakdown(sortedPosts).slice(0, 8)
  const showSuggestions = !state.searchQuery || sortedPosts.length === 0

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
          <select
            name="category"
            defaultValue={state.selectedCategory || ""}
            className="apple-input w-full sm:w-[12rem]"
          >
            <option value="">全部分类</option>
            {allCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={state.sortBy}
            className="apple-input w-full sm:w-[11rem]"
          >
            <option value="default">默认排序</option>
            <option value="newest">最新优先</option>
            <option value="oldest">最早优先</option>
          </select>
          {state.selectedTag ? <input type="hidden" name="tag" value={state.selectedTag} /> : null}
          <button type="submit" className="brand-solid-button whitespace-nowrap px-5 py-2.5">
            搜索
          </button>
        </form>
      }
    >
      {state.searchQuery || state.selectedTag ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>共找到 {sortedPosts.length} 篇结果</span>
          {state.searchQuery ? <span className="apple-pill">关键词：<HighlightedText text={state.searchQuery} query={state.searchQuery} /></span> : null}
          {state.selectedTag ? (
            <>
              <span className="apple-pill">标签：#<HighlightedText text={state.selectedTag} query={state.searchQuery} /></span>
              <Link
                href={buildSearchHref({
                  ...state,
                  selectedTag: null,
                  currentPage: 1,
                })}
                className="text-primary hover:underline"
              >
                清除标签筛选
              </Link>
            </>
          ) : null}
          {state.selectedCategory ? (
            <>
              <span className="apple-pill">分类：<HighlightedText text={state.selectedCategory} query={state.searchQuery} /></span>
              <Link
                href={buildSearchHref({
                  ...state,
                  selectedCategory: null,
                  currentPage: 1,
                })}
                className="text-primary hover:underline"
              >
                清除分类筛选
              </Link>
            </>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-border/50 bg-card p-8 text-center text-muted-foreground">
          输入关键词开始搜索，支持标题、摘要、分类、标签、系列和正文内容。
        </div>
      )}

      {sortedPosts.length > 0 && categoryBreakdown.length > 1 ? (
        <section className="mb-6 rounded-[1.75rem] border border-border/50 bg-card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Category Breakdown</p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em]">结果分类分布</h2>
            </div>
            {state.selectedCategory ? (
              <Link
                href={buildSearchHref({
                  ...state,
                  selectedCategory: null,
                  currentPage: 1,
                })}
                className="text-sm text-primary hover:underline"
              >
                查看全部分类
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryBreakdown.map(({ category, count }) => {
              const isActive = state.selectedCategory === category
              return (
                <Link
                  key={category}
                  href={buildSearchHref({
                    ...state,
                    selectedCategory: category,
                    currentPage: 1,
                  })}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/60 text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {category} · {count}
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {state.searchQuery || state.selectedTag ? (
        paginatedPosts.length > 0 ? (
          <div className="space-y-4">
            {paginatedPosts.map((post) => (
              <PostSearchResultCard
                key={post.id}
                post={post}
                searchQuery={state.searchQuery}
                getTagHref={(tag) =>
                  buildSearchHref({
                    ...state,
                    selectedTag: tag,
                    currentPage: 1,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-border/50 bg-card p-8 text-center text-muted-foreground">
            没有找到匹配的文章，试试换个关键词或标签。
          </div>
        )
      ) : null}

      {showSuggestions ? (
        <section className="mt-8 space-y-5">
          <div>
            <p className="section-kicker">Suggested Searches</p>
            <h2 className="section-title mt-2">猜你想搜</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.75rem] border border-border/50 bg-card p-5">
              <h3 className="text-base font-semibold">热门标签</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {popularTags.map(({ tag, count }) => (
                  <Link
                    key={tag}
                    href={buildSearchHref({
                      searchQuery: "",
                      selectedTag: tag,
                      selectedCategory: null,
                      currentPage: 1,
                      sortBy: "default",
                    })}
                    className="apple-pill hover:bg-white dark:hover:bg-white/12"
                  >
                    #{tag} · {count}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border/50 bg-card p-5">
              <h3 className="text-base font-semibold">热门系列</h3>
              <div className="mt-4 flex flex-col gap-2">
                {popularSeries.map(({ series, count }) => (
                  <Link
                    key={series}
                    href={buildSearchHref({
                      searchQuery: series,
                      selectedTag: null,
                      selectedCategory: null,
                      currentPage: 1,
                      sortBy: "default",
                    })}
                    className="rounded-2xl border border-border/50 px-4 py-3 text-sm transition-colors hover:bg-accent"
                  >
                    <div className="font-medium">{series}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{count} 篇内容</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border/50 bg-card p-5">
              <h3 className="text-base font-semibold">精选内容</h3>
              <div className="mt-4 space-y-3">
                {featuredPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={buildSearchHref({
                      searchQuery: post.title,
                      selectedTag: null,
                      selectedCategory: null,
                      currentPage: 1,
                      sortBy: "default",
                    })}
                    className="block rounded-2xl border border-border/50 px-4 py-3 transition-colors hover:bg-accent"
                  >
                    <div className="font-medium">{post.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{post.category} · {post.date}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {filteredPosts.length > postsPerPage ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={buildSearchHref({
              ...state,
              currentPage: Math.max(1, safeCurrentPage - 1),
            })}
            aria-disabled={safeCurrentPage === 1}
            className={`rounded-xl border border-border/60 px-4 py-2 text-sm ${
              safeCurrentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"
            }`}
          >
            上一页
          </Link>
          <span className="text-sm text-muted-foreground">第 {safeCurrentPage} / {totalPages} 页</span>
          <Link
            href={buildSearchHref({
              ...state,
              currentPage: Math.min(totalPages, safeCurrentPage + 1),
            })}
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
