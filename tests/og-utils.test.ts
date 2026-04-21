import test from "node:test"
import assert from "node:assert/strict"
import { clampOgText, pickOgCategoryLabel } from "../src/lib/og"

test("clampOgText trims whitespace and adds ellipsis when needed", () => {
  assert.equal(clampOgText("  Hello    world  ", 20), "Hello world")
  assert.equal(clampOgText("1234567890", 6), "12345…")
})

test("pickOgCategoryLabel prefers series over category and falls back to brand", () => {
  assert.equal(pickOgCategoryLabel("技术", "工程化改造"), "系列 · 工程化改造")
  assert.equal(pickOgCategoryLabel("技术", ""), "技术")
  assert.equal(pickOgCategoryLabel("", ""), "Champion's Blog")
})
