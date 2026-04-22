import test from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"
import { POST as postsPost } from "../src/app/api/posts/route"
import { DELETE as adminMediaDelete, POST as adminMediaPost } from "../src/app/api/admin/media/route"
import { GET as adminSettingsGet, PATCH as adminSettingsPatch } from "../src/app/api/admin/settings/route"
import { GET as authStatusGet } from "../src/app/api/auth/status/route"
import { GET as feedGet } from "../src/app/api/feed/route"
import { GET as adminMediaGet } from "../src/app/api/admin/media/route"
import { GET as publicSiteSettingsGet } from "../src/app/api/site-settings/route"
import { POST as postViewsPost } from "../src/app/api/posts/[id]/views/route"
import { GET as postDetailGet, PATCH as postPatch } from "../src/app/api/posts/[id]/route"
import { GET as versionsGet, POST as versionsPost } from "../src/app/api/posts/[id]/versions/route"
import { buildSessionCookie, createSessionToken } from "../src/lib/server/auth"
import robots from "../src/app/robots"
import manifest from "../src/app/manifest"

test("feed route uses the production domain and rss metadata", async () => {
  const response = await feedGet()
  const xml = await response.text()

  assert.equal(response.headers.get("Content-Type"), "application/xml; charset=utf-8")
  assert.match(xml, /https:\/\/champion\.cc\.cd\/api\/feed/)
  assert.match(xml, /https:\/\/champion\.cc\.cd\/posts\//)
  assert.doesNotMatch(xml, /my-blog-amber-chi\.vercel\.app/)
})

test("metadata routes expose robots and manifest with the production site identity", async () => {
  const robotsData = robots()
  const manifestData = await manifest()

  assert.equal(robotsData.host, "https://champion.cc.cd")
  assert.equal(robotsData.sitemap, "https://champion.cc.cd/sitemap.xml")
  assert.equal(manifestData.start_url, "/")
  assert.equal(manifestData.display, "standalone")
  assert.equal(typeof manifestData.name, "string")
  assert.equal(manifestData.icons?.[0]?.src, "/favicon.ico")
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

test("public site settings route exposes the normalized site settings", async () => {
  const response = await publicSiteSettingsGet()
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(typeof payload.settings.brandName, "string")
  assert.equal(typeof payload.settings.homeTitle, "string")
})

test("admin media route rejects unauthenticated access", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/admin/media")
  const response = await adminMediaGet(request)
  const payload = await response.json()

  assert.equal(response.status, 401)
  assert.equal(payload.error, "请先登录管理员账号")
})

test("admin settings route rejects unauthenticated access and validates payload", async () => {
  const guestRequest = new NextRequest("https://champion.cc.cd/api/admin/settings")
  const guestResponse = await adminSettingsGet(guestRequest)
  const guestPayload = await guestResponse.json()
  assert.equal(guestResponse.status, 401)
  assert.equal(guestPayload.error, "请先登录管理员账号")

  const cookie = buildSessionCookie(createSessionToken())
  const invalidPatchRequest = new NextRequest("https://champion.cc.cd/api/admin/settings", {
    method: "PATCH",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    body: "null",
  })
  const invalidPatchResponse = await adminSettingsPatch(invalidPatchRequest)
  const invalidPatchPayload = await invalidPatchResponse.json()
  assert.equal(invalidPatchResponse.status, 400)
  assert.equal(invalidPatchPayload.error, "提交的设置内容无效")
})

test("admin settings route saves normalized settings for authenticated requests", async () => {
  const cookie = buildSessionCookie(createSessionToken())
  const request = new NextRequest("https://champion.cc.cd/api/admin/settings", {
    method: "PATCH",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      brandName: "  My New Blog  ",
      aboutTitle: "",
      homeTitle: "新的首页标题",
    }),
  })

  const response = await adminSettingsPatch(request)
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.settings.brandName, "My New Blog")
  assert.equal(payload.settings.homeTitle, "新的首页标题")
  assert.equal(typeof payload.settings.aboutTitle, "string")
  assert.notEqual(payload.settings.aboutTitle, "")
})

test("admin media route validates authenticated upload and delete input", async () => {
  const cookie = buildSessionCookie(createSessionToken())

  const uploadRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "POST",
    headers: { cookie },
    body: new FormData(),
  })
  const uploadResponse = await adminMediaPost(uploadRequest)
  const uploadPayload = await uploadResponse.json()
  assert.equal(uploadResponse.status, 400)
  assert.equal(uploadPayload.error, "请选择要上传的图片")

  const deleteRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "DELETE",
    headers: { cookie },
  })
  const deleteResponse = await adminMediaDelete(deleteRequest)
  const deletePayload = await deleteResponse.json()
  assert.equal(deleteResponse.status, 400)
  assert.equal(deletePayload.error, "缺少素材标识")

  const unsupportedUploadFormData = new FormData()
  unsupportedUploadFormData.append("file", new File(["hello"], "note.txt", { type: "text/plain" }))
  const unsupportedUploadRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "POST",
    headers: { cookie },
    body: unsupportedUploadFormData,
  })
  const unsupportedUploadResponse = await adminMediaPost(unsupportedUploadRequest)
  const unsupportedUploadPayload = await unsupportedUploadResponse.json()
  assert.equal(unsupportedUploadResponse.status, 400)
  assert.match(unsupportedUploadPayload.error, /JPG、PNG、WebP、GIF、SVG/)

  const emptyUploadFormData = new FormData()
  emptyUploadFormData.append("file", new File([], "empty.png", { type: "image/png" }))
  const emptyUploadRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "POST",
    headers: { cookie },
    body: emptyUploadFormData,
  })
  const emptyUploadResponse = await adminMediaPost(emptyUploadRequest)
  const emptyUploadPayload = await emptyUploadResponse.json()
  assert.equal(emptyUploadResponse.status, 400)
  assert.equal(emptyUploadPayload.error, "图片内容为空，请重新选择")

  const mixedUploadFormData = new FormData()
  mixedUploadFormData.append("file", new File(["hello"], "note.txt", { type: "text/plain" }))
  mixedUploadFormData.append("file", new File(["<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"], "ok.svg", { type: "image/svg+xml" }))
  const mixedUploadRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "POST",
    headers: { cookie },
    body: mixedUploadFormData,
  })
  const mixedUploadResponse = await adminMediaPost(mixedUploadRequest)
  const mixedUploadPayload = await mixedUploadResponse.json()
  assert.equal(mixedUploadResponse.status, 201)
  assert.equal(Array.isArray(mixedUploadPayload.assets), true)
  assert.equal(mixedUploadPayload.assets.length, 1)
  assert.equal(Array.isArray(mixedUploadPayload.failures), true)
  assert.equal(mixedUploadPayload.failures.length, 1)

  const invalidBatchDeleteRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "DELETE",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({ ids: [] }),
  })
  const invalidBatchDeleteResponse = await adminMediaDelete(invalidBatchDeleteRequest)
  const invalidBatchDeletePayload = await invalidBatchDeleteResponse.json()
  assert.equal(invalidBatchDeleteResponse.status, 400)
  assert.equal(invalidBatchDeletePayload.error, "缺少素材标识")
})

test("posts route rejects unauthenticated creation requests", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/posts", {
    method: "POST",
    body: JSON.stringify({ title: "Test", content: "Hello" }),
    headers: { "content-type": "application/json" },
  })
  const response = await postsPost(request)
  const payload = await response.json()

  assert.equal(response.status, 401)
  assert.equal(payload.error, "请先登录")
})

test("post detail route hides content for public requests and reveals it for authenticated ones", async () => {
  const guestRequest = new NextRequest("https://champion.cc.cd/api/posts/welcome")
  const guestResponse = await postDetailGet(guestRequest, {
    params: Promise.resolve({ id: "welcome" }),
  })
  const guestPayload = await guestResponse.json()
  assert.equal(guestResponse.status, 200)
  assert.equal("content" in guestPayload, false)
  assert.equal(guestPayload.title, "欢迎来到 Champion 的博客")

  const authRequest = new NextRequest("https://champion.cc.cd/api/posts/welcome", {
    headers: { cookie: buildSessionCookie(createSessionToken()) },
  })
  const authResponse = await postDetailGet(authRequest, {
    params: Promise.resolve({ id: "welcome" }),
  })
  const authPayload = await authResponse.json()
  assert.equal(authResponse.status, 200)
  assert.equal(typeof authPayload.content, "string")
})

test("post patch and versions endpoints reject unauthenticated access", async () => {
  const patchRequest = new NextRequest("https://champion.cc.cd/api/posts/welcome", {
    method: "PATCH",
    body: JSON.stringify({ title: "New title" }),
    headers: { "content-type": "application/json" },
  })
  const patchResponse = await postPatch(patchRequest, {
    params: Promise.resolve({ id: "welcome" }),
  })
  const patchPayload = await patchResponse.json()
  assert.equal(patchResponse.status, 401)
  assert.equal(patchPayload.error, "请先登录")

  const versionsRequest = new NextRequest("https://champion.cc.cd/api/posts/welcome/versions")
  const versionsResponse = await versionsGet(versionsRequest, {
    params: Promise.resolve({ id: "welcome" }),
  })
  const versionsPayload = await versionsResponse.json()
  assert.equal(versionsResponse.status, 401)
  assert.equal(versionsPayload.error, "请先登录")
})

test("versions restore route validates versionId after authentication", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/posts/welcome/versions", {
    method: "POST",
    headers: {
      cookie: buildSessionCookie(createSessionToken()),
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  })
  const response = await versionsPost(request, {
    params: Promise.resolve({ id: "welcome" }),
  })
  const payload = await response.json()

  assert.equal(response.status, 400)
  assert.equal(payload.error, "缺少版本 ID")
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
