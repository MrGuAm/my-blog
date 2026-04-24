import test from "node:test"
import assert from "node:assert/strict"
import { buildSearchHref, parseSearchQueryState } from "../src/lib/search-query"

test("parseSearchQueryState normalizes search page params", () => {
  const state = parseSearchQueryState({
    q: " React ",
    tag: "Hooks",
    category: "前端",
    sort: "oldest",
    page: "3",
  })

  assert.deepEqual(state, {
    searchQuery: "React",
    selectedTag: "Hooks",
    selectedCategory: "前端",
    currentPage: 3,
    sortBy: "oldest",
    viewMode: "cards",
  })
})

test("parseSearchQueryState falls back to safe defaults", () => {
  const state = parseSearchQueryState({
    page: "-2",
    sort: "weird",
  })

  assert.deepEqual(state, {
    searchQuery: "",
    selectedTag: null,
    selectedCategory: null,
    currentPage: 1,
    sortBy: "default",
    viewMode: "cards",
  })
})

test("buildSearchHref omits default search params and preserves active filters", () => {
  const href = buildSearchHref({
    searchQuery: "React",
    selectedTag: "Hooks",
    selectedCategory: "前端",
    currentPage: 2,
    sortBy: "newest",
    viewMode: "compact",
  })

  assert.equal(href, "/search?q=React&tag=Hooks&category=%E5%89%8D%E7%AB%AF&sort=newest&view=compact&page=2")
})
