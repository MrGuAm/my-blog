import test from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"
import { GET as authStatusGet } from "../src/app/api/auth/status/route"
import { GET as feedGet } from "../src/app/api/feed/route"
import { GET as adminMediaGet } from "../src/app/api/admin/media/route"
import { POST as postViewsPost } from "../src/app/api/posts/[id]/views/route"
import { buildSessionCookie, createSessionToken } from "../src/lib/server/auth"

test("feed route uses the production domain and rss metadata", async () => {
  const response = await feedGet()
  const xml = await response.text()

  assert.equal(response.headers.get("Content-Type"), "application/xml; charset=utf-8")
  assert.match(xml, /https:\/\/champion\.cc\.cd\/api\/feed/)
  assert.match(xml, /https:\/\/champion\.cc\.cd\/posts\//)
  assert.doesNotMatch(xml, /my-blog-amber-chi\.vercel\.app/)
})

test("auth status route reflects whether a valid session cookie exists", async () => {
  const guestRequest = new NextRequest("https://champion.cc.cd/api/auth/status")
  const guestResponse = await authStatusGet(guestRequest)
  const guestPayload = await guestResponse.json()
  assert.equal(guestPayload.authenticated, false)

  const token = createSessionToken()
  const sessionRequest = new NextRequest("https://champion.cc.cd/api/auth/status", {
    headers: {
      cookie: buildSessionCookie(token),
    },
  })
  const sessionResponse = await authStatusGet(sessionRequest)
  const sessionPayload = await sessionResponse.json()
  assert.equal(sessionPayload.authenticated, true)
})

test("admin media route rejects unauthenticated access", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/admin/media")
  const response = await adminMediaGet(request)
  const payload = await response.json()

  assert.equal(response.status, 401)
  assert.equal(payload.error, "请先登录管理员账号")
})

test("post views route returns 404 for a missing post", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/posts/missing/views", { method: "POST" })
  const response = await postViewsPost(request, {
    params: Promise.resolve({ id: "missing-post-id" }),
  })
  const payload = await response.json()

  assert.equal(response.status, 404)
  assert.equal(payload.error, "文章不存在")
})
