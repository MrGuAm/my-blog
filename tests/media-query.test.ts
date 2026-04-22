import test from "node:test"
import assert from "node:assert/strict"
import { parseMediaQueryState } from "../src/lib/media-query"

test("parseMediaQueryState normalizes media admin query params", () => {
  const state = parseMediaQueryState({
    q: "  cover  ",
    time: "7d",
    sort: "largest",
  })

  assert.equal(state.keyword, "cover")
  assert.equal(state.timeFilter, "7d")
  assert.equal(state.sortBy, "largest")
})

test("parseMediaQueryState falls back to safe defaults", () => {
  const state = parseMediaQueryState({
    q: ["", "ignored"],
    time: "invalid",
    sort: "weird",
  })

  assert.equal(state.keyword, "")
  assert.equal(state.timeFilter, "all")
  assert.equal(state.sortBy, "newest")
})
