"use client"

import { useState } from "react"
import Link from "next/link"
import { buildSearchHref, type SearchSortOption } from "@/lib/search-query"
import { clearRecentSearches, readRecentSearches, removeRecentSearch } from "@/lib/recent-searches"

interface SearchRecentSearchesProps {
  sortBy: SearchSortOption
  className?: string
}

export default function SearchRecentSearches({
  sortBy,
  className = "rounded-[1.75rem] border border-border/50 bg-card p-5",
}: SearchRecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches())

  if (recentSearches.length === 0) return null

  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Recent Searches</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em]">最近搜索</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            clearRecentSearches()
            setRecentSearches([])
          }}
          className="text-sm text-primary hover:underline"
        >
          清空历史
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentSearches.map((recentSearch) => (
          <div key={recentSearch} className="group inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 pr-2">
            <Link
              href={buildSearchHref({
                searchQuery: recentSearch,
                selectedTag: null,
                selectedCategory: null,
                currentPage: 1,
                sortBy,
              })}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {recentSearch}
            </Link>
            <button
              type="button"
              onClick={() => setRecentSearches(removeRecentSearch(recentSearch))}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`移除最近搜索 ${recentSearch}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
