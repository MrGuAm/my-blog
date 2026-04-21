import test from "node:test"
import assert from "node:assert/strict"
import { buildEditorImageTag, normalizeEditorImageFile } from "../src/lib/editor-media"
import { buildExpiredSessionCookie, buildSessionCookie, createSessionToken, getAuthPassword, isValidSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "../src/lib/server/auth"

test("editor image tag builder uses the provided url and alt text", () => {
  const tag = buildEditorImageTag("https://example.com/cover.png", "封面")

  assert.match(tag, /https:\/\/example\.com\/cover\.png/)
  assert.match(tag, /alt="封面"/)
  assert.match(tag, /max-width:100%/)
})

test("normalizeEditorImageFile returns non-heic files unchanged", async () => {
  const file = new File(["hello"], "hello.png", { type: "image/png" })
  const normalized = await normalizeEditorImageFile(file)

  assert.strictEqual(normalized, file)
})

test("session token lifecycle helpers generate usable cookies", () => {
  const token = createSessionToken()

  assert.equal(isValidSessionToken(token), true)

  const cookie = buildSessionCookie(token)
  assert.match(cookie, new RegExp(`^${SESSION_COOKIE_NAME}=`))
  assert.match(cookie, new RegExp(`Max-Age=${SESSION_MAX_AGE}`))
  assert.match(cookie, /HttpOnly/)

  const expiredCookie = buildExpiredSessionCookie()
  assert.match(expiredCookie, /Max-Age=0/)
})

test("getAuthPassword prefers AUTH_PASSWORD over NEXT_PUBLIC_PASSWORD", () => {
  const previousAuth = process.env.AUTH_PASSWORD
  const previousPublic = process.env.NEXT_PUBLIC_PASSWORD

  process.env.AUTH_PASSWORD = "server-password"
  process.env.NEXT_PUBLIC_PASSWORD = "public-password"
  assert.equal(getAuthPassword(), "server-password")

  delete process.env.AUTH_PASSWORD
  assert.equal(getAuthPassword(), "public-password")

  if (previousAuth === undefined) {
    delete process.env.AUTH_PASSWORD
  } else {
    process.env.AUTH_PASSWORD = previousAuth
  }

  if (previousPublic === undefined) {
    delete process.env.NEXT_PUBLIC_PASSWORD
  } else {
    process.env.NEXT_PUBLIC_PASSWORD = previousPublic
  }
})
