import test from "node:test"
import assert from "node:assert/strict"
import { calculateReadingTime, extractHeadings } from "../src/lib/posts"

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
