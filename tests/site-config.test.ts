import test from "node:test"
import assert from "node:assert/strict"
import { absoluteUrl, siteConfig } from "../src/lib/site-config"
import { defaultSiteSettings, normalizeSiteSettings } from "../src/lib/site-settings"

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

test("absoluteUrl preserves encoded nested paths for series pages", () => {
  assert.equal(
    absoluteUrl(`/series/${encodeURIComponent("工程化改造")}`),
    "https://champion.cc.cd/series/%E5%B7%A5%E7%A8%8B%E5%8C%96%E6%94%B9%E9%80%A0",
  )
})

test("normalizeSiteSettings falls back to defaults for empty values", () => {
  const normalized = normalizeSiteSettings({
    brandName: "  ",
    authorName: "",
    twitterHandle: "   ",
    seoKeywords: "",
    homeTitle: "新的首页标题",
    footerText: "",
  })

  assert.equal(normalized.brandName, defaultSiteSettings.brandName)
  assert.equal(normalized.authorName, defaultSiteSettings.authorName)
  assert.equal(normalized.twitterHandle, defaultSiteSettings.twitterHandle)
  assert.equal(normalized.seoKeywords, defaultSiteSettings.seoKeywords)
  assert.equal(normalized.homeTitle, "新的首页标题")
  assert.equal(normalized.footerText, defaultSiteSettings.footerText)
})
