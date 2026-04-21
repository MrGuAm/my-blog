import test from "node:test"
import assert from "node:assert/strict"
import { calculateReadingTime, extractHeadings, sortSeriesPosts, type Post } from "../src/lib/posts"

test("calculateReadingTime strips html and never returns less than one minute", () => {
  assert.equal(calculateReadingTime("<p>你好</p>"), 1)

  const longText = `<p>${Array.from({ length: 450 }, (_, index) => `word-${index}`).join(" ")}</p>`
  assert.equal(calculateReadingTime(longText), 3)
})

test("extractHeadings returns toc items for h2 and h3 only", () => {
  const headings = extractHeadings(`
    <h2>第一章</h2>
    <p>正文</p>
    <h3>第二节：开始</h3>
    <h4>不应出现</h4>
    <h2>React Hooks</h2>
  `)

  assert.deepEqual(headings, [
    { id: "第一章", text: "第一章", level: 2 },
    { id: "第二节-开始", text: "第二节：开始", level: 3 },
    { id: "react-hooks", text: "React Hooks", level: 2 },
  ])
})

test("sortSeriesPosts prioritizes explicit series order before date", () => {
  const posts: Post[] = [
    {
      id: "3",
      title: "第三篇",
      excerpt: "",
      date: "2026-04-03",
      category: "随笔",
      tags: [],
      content: "<p>third</p>",
      series: "测试系列",
      seriesOrder: 3,
    },
    {
      id: "1",
      title: "第一篇",
      excerpt: "",
      date: "2026-04-01",
      category: "随笔",
      tags: [],
      content: "<p>first</p>",
      series: "测试系列",
      seriesOrder: 1,
    },
    {
      id: "2",
      title: "第二篇",
      excerpt: "",
      date: "2026-04-02",
      category: "随笔",
      tags: [],
      content: "<p>second</p>",
      series: "测试系列",
      seriesOrder: 2,
    },
  ]

  assert.deepEqual(
    sortSeriesPosts(posts).map((post) => post.id),
    ["1", "2", "3"]
  )
})
