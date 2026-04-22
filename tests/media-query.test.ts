import test from "node:test"
import assert from "node:assert/strict"
import { parseMediaQueryState } from "../src/lib/media-query"

test("parseMediaQueryState normalizes media admin query params", () => {
  const state = parseMediaQueryState({
    q: "  cover  ",
    time: "7d",
    storage: "blob",
    format: "webp",
    orientation: "portrait",
    usage: "unused",
    sort: "most-used",
    page: "3",
  })

  assert.equal(state.keyword, "cover")
  assert.equal(state.timeFilter, "7d")
  assert.equal(state.storageFilter, "blob")
  assert.equal(state.formatFilter, "webp")
  assert.equal(state.orientationFilter, "portrait")
  assert.equal(state.usageFilter, "unused")
  assert.equal(state.sortBy, "most-used")
  assert.equal(state.currentPage, 3)
})

test("parseMediaQueryState falls back to safe defaults", () => {
  const state = parseMediaQueryState({
    q: ["", "ignored"],
    time: "invalid",
    sort: "weird",
  })

  assert.equal(state.keyword, "")
  assert.equal(state.timeFilter, "all")
  assert.equal(state.storageFilter, "all")
  assert.equal(state.formatFilter, "all")
  assert.equal(state.orientationFilter, "all")
  assert.equal(state.usageFilter, "all")
  assert.equal(state.sortBy, "newest")
  assert.equal(state.currentPage, 1)
})
