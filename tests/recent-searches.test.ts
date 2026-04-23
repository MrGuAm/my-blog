import test from "node:test"
import assert from "node:assert/strict"
import { buildRecentSearches } from "../src/lib/recent-searches"

test("buildRecentSearches keeps newest query first and removes duplicates", () => {
  const next = buildRecentSearches(["React", "Next.js", "Music"], "next.js")

  assert.deepEqual(next, ["next.js", "React", "Music"])
})

test("buildRecentSearches ignores empty values and respects limit", () => {
  const next = buildRecentSearches(
    ["a", "b", "c", "d", "e", "f", "g", "h"],
    "   "
  )

  assert.deepEqual(next, ["a", "b", "c", "d", "e", "f", "g", "h"])
})
