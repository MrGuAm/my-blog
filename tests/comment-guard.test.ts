import test from "node:test"
import assert from "node:assert/strict"
import { validateCommentContent } from "../src/lib/server/comment-guard"
import { normalizeCommentStatus } from "../src/lib/server/store"

test("validateCommentContent rejects too-short, blocked, and suspicious link comments", () => {
  assert.equal(validateCommentContent("哈"), "评论至少写两个字吧")
  assert.equal(validateCommentContent("加微信聊一下"), "评论里包含了不适合公开展示的内容")
  assert.equal(validateCommentContent("https://a.co"), "带链接的评论太短了，系统先拦一下")
})

test("validateCommentContent accepts normal comments", () => {
  assert.equal(validateCommentContent("这篇文章写得很舒服，收藏了。"), "")
})

test("normalizeCommentStatus only preserves supported moderation states", () => {
  assert.equal(normalizeCommentStatus("pending"), "pending")
  assert.equal(normalizeCommentStatus("rejected"), "rejected")
  assert.equal(normalizeCommentStatus("approved"), "approved")
  assert.equal(normalizeCommentStatus("unexpected"), "approved")
  assert.equal(normalizeCommentStatus(undefined), "approved")
})
