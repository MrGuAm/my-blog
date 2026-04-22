import test from "node:test"
import assert from "node:assert/strict"
import { normalizeCommentLink, parseCommentMarkdown } from "../src/lib/comment-markdown"

test("normalizeCommentLink only accepts allowed protocols", () => {
  assert.equal(normalizeCommentLink("https://example.com/post"), "https://example.com/post")
  assert.equal(normalizeCommentLink("http://example.com/post"), "http://example.com/post")
  assert.equal(normalizeCommentLink("mailto:test@example.com"), "mailto:test@example.com")
  assert.equal(normalizeCommentLink("javascript:alert(1)"), null)
  assert.equal(normalizeCommentLink("data:text/html;base64,abc"), null)
  assert.equal(normalizeCommentLink("ftp://example.com/file"), null)
})

test("parseCommentMarkdown strips unsafe markdown links", () => {
  const html = parseCommentMarkdown("看看这个 [危险链接](javascript:alert(1)) 和 [正常链接](https://example.com)")

  assert.ok(!html.includes('href="javascript:alert(1)"'))
  assert.ok(html.includes(">危险链接</a>") === false)
  assert.ok(html.includes("危险链接"))
  assert.ok(html.includes('href="https://example.com"'))
  assert.ok(html.includes('rel="noopener noreferrer"'))
})
