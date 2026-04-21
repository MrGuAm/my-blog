import test from "node:test"
import assert from "node:assert/strict"
import type { Post } from "../src/lib/posts"
import { buildBlogPostingStructuredData } from "../src/lib/server/site-metadata"

test("buildBlogPostingStructuredData uses the canonical post url and author name", async () => {
  const post: Post = {
    id: "welcome",
    slug: "welcome",
    title: "欢迎来到博客",
    excerpt: "这是一篇欢迎文章",
    date: "2026-04-01",
    category: "随笔",
    tags: ["博客", "欢迎"],
    content: "<p>Hello</p>",
    coverImage: "/uploads/cover.png",
    seriesOrder: 2,
  }

  const data = await buildBlogPostingStructuredData(post)

  assert.equal(data["@type"], "BlogPosting")
  assert.equal(data.url, "https://champion.cc.cd/posts/welcome")
  assert.equal(data.mainEntityOfPage, "https://champion.cc.cd/posts/welcome")
  assert.equal(data.author.name, "Champion")
  assert.deepEqual(data.image, ["https://champion.cc.cd/uploads/cover.png"])
  assert.equal(data.position, 2)
})
