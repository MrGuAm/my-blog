import test from "node:test"
import assert from "node:assert/strict"
import {
  buildMediaAssetCsv,
  buildMediaAssetBatchText,
  extractClipboardMediaFiles,
  formatMediaUploadBatchMessage,
  getMediaFormatFilter,
  getMediaOrientation,
  getMediaUploadHint,
  sortMediaAssets,
  validateMediaUploadInput,
} from "../src/lib/media-upload"
import { countMediaAssetUsage, describeMediaAssetUsage, getMediaUsageHref, getMediaUsageScope } from "../src/lib/media-usage"

test("validateMediaUploadInput rejects empty, oversized, and unsupported files", () => {
  assert.equal(validateMediaUploadInput({ size: 0, type: "image/png" }), "图片内容为空，请重新选择")
  assert.match(String(validateMediaUploadInput({ size: 1024, type: "text/plain" })), /JPG、PNG、WebP、GIF、SVG/)
  assert.match(
    String(validateMediaUploadInput({ size: 5 * 1024 * 1024, type: "image/png" })),
    /4.5MB/
  )
})

test("validateMediaUploadInput accepts supported images and upload hint stays in sync", () => {
  assert.equal(validateMediaUploadInput({ size: 1024, type: "image/png" }), null)
  assert.match(getMediaUploadHint(), /JPG、PNG、WebP、GIF、SVG/)
  assert.match(getMediaUploadHint(), /4.5MB/)
})

test("formatMediaUploadBatchMessage summarizes single and batch uploads", () => {
  assert.equal(formatMediaUploadBatchMessage({ successCount: 1, failures: [] }), "素材上传成功")
  assert.equal(formatMediaUploadBatchMessage({ successCount: 3, failures: [] }), "已上传 3 张素材")
  assert.match(
    formatMediaUploadBatchMessage({
      successCount: 2,
      failures: [{ name: "bad.png", reason: "图片内容为空，请重新选择" }],
    }),
    /已上传 2 张，1 张失败/
  )
})

test("extractClipboardMediaFiles keeps supported image files only", () => {
  const pngFile = new File(["ok"], "clip.png", { type: "image/png" })
  const textFile = new File(["note"], "note.txt", { type: "text/plain" })

  const files = extractClipboardMediaFiles([
    {
      kind: "file",
      type: "image/png",
      getAsFile: () => pngFile,
    },
    {
      kind: "file",
      type: "text/plain",
      getAsFile: () => textFile,
    },
    {
      kind: "string",
      type: "text/plain",
      getAsFile: () => null,
    },
  ])

  assert.equal(files.length, 1)
  assert.equal(files[0]?.name, "clip.png")
})

test("buildMediaAssetBatchText renders selected assets for url, markdown, and html copy", () => {
  const assets = [
    { name: "封面图", url: "https://example.com/a.webp" },
    { name: "插图", url: "https://example.com/b.webp" },
  ]

  assert.equal(
    buildMediaAssetBatchText(assets, "url"),
    "https://example.com/a.webp\nhttps://example.com/b.webp"
  )
  assert.match(buildMediaAssetBatchText(assets, "markdown"), /!\[封面图\]\(https:\/\/example.com\/a.webp\)/)
  assert.match(buildMediaAssetBatchText(assets, "html"), /<img src="https:\/\/example.com\/b.webp" alt="插图" \/>/)
})

test("buildMediaAssetCsv exports a stable csv table for selected assets", () => {
  const csv = buildMediaAssetCsv([
    {
      name: '封面图 "A"',
      url: "https://example.com/a.webp",
      size: 1024,
      width: 1600,
      height: 900,
      storage: "blob",
      usageCount: 2,
      updatedAt: "2026-04-22T10:00:00.000Z",
    },
  ])

  assert.match(csv, /^name,url,size,dimensions,storage,usageCount,updatedAt/m)
  assert.match(csv, /"封面图 ""A"""/)
  assert.match(csv, /1600x900/)
  assert.match(csv, /blob/)
  assert.match(csv, /2026-04-22T10:00:00.000Z/)
})

test("sortMediaAssets supports time, size, and name ordering", () => {
  const assets = [
    { name: "b-file", url: "/b", size: 300, updatedAt: "2026-04-20T10:00:00.000Z", usageCount: 3 },
    { name: "a-file", url: "/a", size: 100, updatedAt: "2026-04-22T10:00:00.000Z", usageCount: 1 },
    { name: "c-file", url: "/c", size: 200, updatedAt: "2026-04-21T10:00:00.000Z", usageCount: 0 },
  ]

  assert.deepEqual(sortMediaAssets(assets, "newest").map((asset) => asset.name), ["a-file", "c-file", "b-file"])
  assert.deepEqual(sortMediaAssets(assets, "oldest").map((asset) => asset.name), ["b-file", "c-file", "a-file"])
  assert.deepEqual(sortMediaAssets(assets, "largest").map((asset) => asset.name), ["b-file", "c-file", "a-file"])
  assert.deepEqual(sortMediaAssets(assets, "smallest").map((asset) => asset.name), ["a-file", "c-file", "b-file"])
  assert.deepEqual(sortMediaAssets(assets, "most-used").map((asset) => asset.name), ["b-file", "a-file", "c-file"])
  assert.deepEqual(sortMediaAssets(assets, "least-used").map((asset) => asset.name), ["c-file", "a-file", "b-file"])
  assert.deepEqual(sortMediaAssets(assets, "name-asc").map((asset) => asset.name), ["a-file", "b-file", "c-file"])
  assert.deepEqual(sortMediaAssets(assets, "name-desc").map((asset) => asset.name), ["c-file", "b-file", "a-file"])
})

test("getMediaOrientation classifies landscape, portrait, square, and unknown assets", () => {
  assert.equal(getMediaOrientation(1600, 900), "landscape")
  assert.equal(getMediaOrientation(900, 1600), "portrait")
  assert.equal(getMediaOrientation(1080, 1080), "square")
  assert.equal(getMediaOrientation(null, 1080), "unknown")
})

test("getMediaFormatFilter groups common image formats", () => {
  assert.equal(getMediaFormatFilter("image/webp"), "webp")
  assert.equal(getMediaFormatFilter("image/svg+xml"), "svg")
  assert.equal(getMediaFormatFilter("image/gif"), "gif")
  assert.equal(getMediaFormatFilter("image/png"), "png")
  assert.equal(getMediaFormatFilter("image/jpeg"), "jpeg")
  assert.equal(getMediaFormatFilter("application/octet-stream"), "other")
})

test("countMediaAssetUsage tracks cover and content references per post", () => {
  const assets = [
    { id: "cover", url: "https://example.com/cover.webp" },
    { id: "inline", url: "https://example.com/inline.webp" },
    { id: "unused", url: "https://example.com/unused.webp" },
  ]
  const posts = [
    {
      id: "post-a",
      coverImage: "https://example.com/cover.webp",
      content: '<p><img src="https://example.com/inline.webp" /></p>',
    },
    {
      id: "post-b",
      coverImage: "",
      content: '<p><img src="https://example.com/inline.webp" /></p>',
    },
  ]

  const usage = countMediaAssetUsage(assets, posts)
  assert.equal(usage.get("cover"), 1)
  assert.equal(usage.get("inline"), 2)
  assert.equal(usage.get("unused"), 0)
})

test("describeMediaAssetUsage preserves reference details and usage kinds", () => {
  const assets = [
    { id: "hero", url: "https://example.com/hero.webp", pathname: "hero.webp" },
    { id: "inline", url: "https://example.com/inline.webp", pathname: "inline.webp" },
  ]
  const posts = [
    {
      id: "post-a",
      title: "第一篇",
      slug: "first-post",
      draft: false,
      coverImage: "https://example.com/hero.webp",
      content: '<p><img src="inline.webp" /></p>',
    },
    {
      id: "post-b",
      title: "第二篇",
      slug: "second-post",
      draft: true,
      coverImage: "https://example.com/hero.webp",
      content: '<p><img src="https://example.com/hero.webp" /></p>',
    },
  ]

  const usage = describeMediaAssetUsage(assets, posts)
  assert.equal(usage.get("hero")?.count, 2)
  assert.equal(usage.get("hero")?.posts[0]?.kind, "cover")
  assert.equal(usage.get("hero")?.posts[1]?.kind, "cover+content")
  assert.equal(usage.get("hero")?.posts[1]?.draft, true)
  assert.equal(usage.get("inline")?.count, 1)
  assert.equal(usage.get("inline")?.posts[0]?.kind, "content")
})

test("getMediaUsageHref points drafts to editor and published posts to reader view", () => {
  assert.equal(
    getMediaUsageHref({ postId: "draft-1", postSlug: "draft-slug", draft: true }),
    "/write/draft-1"
  )
  assert.equal(
    getMediaUsageHref({ postId: "post-1", postSlug: "hello-world", draft: false }),
    "/posts/hello-world"
  )
  assert.equal(
    getMediaUsageHref({ postId: "post-2", draft: false }),
    "/posts/post-2"
  )
})

test("getMediaUsageScope distinguishes cover, content, mixed, and unused assets", () => {
  assert.equal(getMediaUsageScope(), "unused")
  assert.equal(
    getMediaUsageScope([{ postId: "1", postTitle: "封面稿", draft: false, kind: "cover" }]),
    "cover"
  )
  assert.equal(
    getMediaUsageScope([{ postId: "2", postTitle: "正文稿", draft: false, kind: "content" }]),
    "content"
  )
  assert.equal(
    getMediaUsageScope([{ postId: "3", postTitle: "双用途稿", draft: false, kind: "cover+content" }]),
    "mixed"
  )
})
