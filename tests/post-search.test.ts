import test from "node:test"
import assert from "node:assert/strict"
import type { Post } from "../src/lib/posts"
import { filterPostsForListing, matchesPostSearch } from "../src/lib/post-search"

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
