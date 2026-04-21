import test from "node:test"
import assert from "node:assert/strict"
import { absoluteUrl, siteConfig } from "../src/lib/site-config"

test("absoluteUrl uses the production domain for root and nested paths", () => {
  assert.equal(absoluteUrl("/"), "https://champion.cc.cd/")
  assert.equal(absoluteUrl("/posts/hello-world"), "https://champion.cc.cd/posts/hello-world")
  assert.equal(absoluteUrl("about"), "https://champion.cc.cd/about")
})

test("siteConfig keeps the expected public metadata defaults", () => {
  assert.equal(siteConfig.name, "Champion's Blog")
  assert.equal(siteConfig.url, "https://champion.cc.cd")
  assert.equal(siteConfig.rssPath, "/api/feed")
  assert.ok(siteConfig.keywords.includes("博客"))
})
