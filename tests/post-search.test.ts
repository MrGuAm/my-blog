import test from "node:test"
import assert from "node:assert/strict"
import type { Post } from "../src/lib/posts"
import {
  filterPostsForListing,
  getPostCategoryBreakdown,
  getPostSearchFallbackSuggestions,
  getPostSearchMatchScope,
  getPostSearchSuggestions,
  matchesPostSearch,
  sortSearchResults,
  splitHighlightedText,
} from "../src/lib/post-search"

const posts: Post[] = [
  {
    id: "react-note",
    title: "React Hooks 心得",
    excerpt: "关于 useEffect 和副作用的整理",
    date: "2026-04-20",
    category: "前端",
    tags: ["React", "Hooks"],
    content: "<p>这篇文章会详细聊 useEffect、依赖数组和副作用时机。</p>",
    featured: true,
  },
  {
    id: "music-draft",
    title: "播放器草稿",
    excerpt: "还没写完的音乐页思路",
    date: "2026-04-18",
    category: "产品",
    tags: ["Music"],
    content: "<p>这里记录歌词滚动、收藏和最近播放的交互。</p>",
    draft: true,
  },
]

test("matchesPostSearch supports body text and metadata fields", () => {
  assert.equal(matchesPostSearch(posts[0], "useEffect"), true)
  assert.equal(matchesPostSearch(posts[0], "前端"), true)
  assert.equal(matchesPostSearch(posts[0], "Hooks"), true)
  assert.equal(matchesPostSearch(posts[0], "不存在"), false)
})

test("filterPostsForListing respects drafts, tag, and search query", () => {
  const result = filterPostsForListing(posts, {
    includeDrafts: false,
    searchQuery: "歌词",
    selectedTag: "Music",
  })

  assert.deepEqual(result, [])

  const withDraft = filterPostsForListing(posts, {
    includeDrafts: true,
    searchQuery: "歌词",
    selectedTag: "Music",
  })

  assert.deepEqual(withDraft.map((post) => post.id), ["music-draft"])
})

test("filterPostsForListing respects category filters", () => {
  const result = filterPostsForListing(posts, {
    includeDrafts: true,
    searchQuery: "",
    selectedTag: null,
    selectedCategory: "前端",
  })

  assert.deepEqual(result.map((post) => post.id), ["react-note"])
})

test("getPostSearchMatchScope reports which post fields matched", () => {
  const scope = getPostSearchMatchScope(posts[0], "useEffect")

  assert.deepEqual(scope, {
    title: false,
    excerpt: true,
    category: false,
    series: false,
    tags: false,
    content: true,
  })
})

test("splitHighlightedText preserves text order and marks matched segments", () => {
  const parts = splitHighlightedText("React Hooks 心得", "react")

  assert.deepEqual(parts, [
    { text: "React", match: true },
    { text: " Hooks 心得", match: false },
  ])
})

test("getPostSearchSuggestions returns matching tags and series with starts-with priority", () => {
  const suggestions = getPostSearchSuggestions(
    ["React", "Hooks", "前端工程"],
    ["React 深入", "音乐设计", "Hooks 细节"],
    "re"
  )

  assert.deepEqual(suggestions, [
    { type: "tag", value: "React" },
    { type: "series", value: "React 深入" },
  ])
})

test("sortSearchResults supports newest and oldest ordering", () => {
  assert.deepEqual(
    sortSearchResults(posts, "newest").map((post) => post.id),
    ["react-note", "music-draft"]
  )

  assert.deepEqual(
    sortSearchResults(posts, "oldest").map((post) => post.id),
    ["music-draft", "react-note"]
  )
})

test("getPostCategoryBreakdown summarizes categories by count", () => {
  assert.deepEqual(getPostCategoryBreakdown(posts), [
    { category: "产品", count: 1 },
    { category: "前端", count: 1 },
  ])
})

test("getPostSearchFallbackSuggestions returns near matches for misspelled searches", () => {
  const suggestions = getPostSearchFallbackSuggestions(
    ["React", "Hooks"],
    ["React 深入", "音乐设计"],
    ["前端", "产品"],
    "Ract"
  )

  assert.deepEqual(suggestions, [
    { type: "tag", value: "React" },
  ])
})
