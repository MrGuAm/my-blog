import test from "node:test"
import assert from "node:assert/strict"
import { formatMediaUploadBatchMessage, getMediaUploadHint, validateMediaUploadInput } from "../src/lib/media-upload"

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
