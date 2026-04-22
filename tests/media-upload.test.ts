import test from "node:test"
import assert from "node:assert/strict"
import { getMediaUploadHint, validateMediaUploadInput } from "../src/lib/media-upload"

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
