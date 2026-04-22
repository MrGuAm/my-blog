import test from "node:test"
import assert from "node:assert/strict"
import {
  buildMediaAssetBatchText,
  extractClipboardMediaFiles,
  formatMediaUploadBatchMessage,
  getMediaOrientation,
  getMediaUploadHint,
  sortMediaAssets,
  validateMediaUploadInput,
} from "../src/lib/media-upload"

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

test("sortMediaAssets supports time, size, and name ordering", () => {
  const assets = [
    { name: "b-file", url: "/b", size: 300, updatedAt: "2026-04-20T10:00:00.000Z" },
    { name: "a-file", url: "/a", size: 100, updatedAt: "2026-04-22T10:00:00.000Z" },
    { name: "c-file", url: "/c", size: 200, updatedAt: "2026-04-21T10:00:00.000Z" },
  ]

  assert.deepEqual(sortMediaAssets(assets, "newest").map((asset) => asset.name), ["a-file", "c-file", "b-file"])
  assert.deepEqual(sortMediaAssets(assets, "oldest").map((asset) => asset.name), ["b-file", "c-file", "a-file"])
  assert.deepEqual(sortMediaAssets(assets, "largest").map((asset) => asset.name), ["b-file", "c-file", "a-file"])
  assert.deepEqual(sortMediaAssets(assets, "smallest").map((asset) => asset.name), ["a-file", "c-file", "b-file"])
  assert.deepEqual(sortMediaAssets(assets, "name-asc").map((asset) => asset.name), ["a-file", "b-file", "c-file"])
  assert.deepEqual(sortMediaAssets(assets, "name-desc").map((asset) => asset.name), ["c-file", "b-file", "a-file"])
})

test("getMediaOrientation classifies landscape, portrait, square, and unknown assets", () => {
  assert.equal(getMediaOrientation(1600, 900), "landscape")
  assert.equal(getMediaOrientation(900, 1600), "portrait")
  assert.equal(getMediaOrientation(1080, 1080), "square")
  assert.equal(getMediaOrientation(null, 1080), "unknown")
})
