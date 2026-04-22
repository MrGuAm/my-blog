import test from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"
import sharp from "sharp"
import { buildSessionCookie, createSessionToken } from "../src/lib/server/auth"
import { importFresh, withTempWorkspace } from "./helpers/temp-workspace"

test("admin media routes can upload, list, and delete a file in an isolated workspace", async () => {
  await withTempWorkspace(async () => {
    const mediaRoute = await importFresh<typeof import("../src/app/api/admin/media/route")>("src/app/api/admin/media/route.ts")
    const tinyPngBuffer = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: { r: 255, g: 128, b: 64 },
      },
    })
      .png()
      .toBuffer()

    const cookie = buildSessionCookie(createSessionToken())
    const formData = new FormData()
    formData.append("file", new File([tinyPngBuffer], "proof.png", { type: "image/png" }))

    const createRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
      method: "POST",
      headers: { cookie },
      body: formData,
    })
    const createResponse = await mediaRoute.POST(createRequest)
    const created = await createResponse.json()

    assert.equal(createResponse.status, 201)
    assert.equal(created.asset.storage, "local")
    assert.match(created.asset.url, /\/uploads\//)

    const listRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
      headers: { cookie },
    })
    const listResponse = await mediaRoute.GET(listRequest)
    const listPayload = await listResponse.json()
    assert.equal(listResponse.status, 200)
    assert.ok(listPayload.assets.some((asset: { id: string }) => asset.id === created.asset.id))

    const deleteRequest = new NextRequest(`https://champion.cc.cd/api/admin/media?id=${encodeURIComponent(created.asset.id)}`, {
      method: "DELETE",
      headers: { cookie },
    })
    const deleteResponse = await mediaRoute.DELETE(deleteRequest)
    const deletedPayload = await deleteResponse.json()

    assert.equal(deleteResponse.status, 200)
    assert.equal(deletedPayload.success, true)
    assert.deepEqual(deletedPayload.deletedIds, [created.asset.id])
    assert.deepEqual(deletedPayload.missingIds, [])
    assert.deepEqual(deletedPayload.failedIds, [])
  })
})

test("admin media routes can batch upload files in one request", async () => {
  await withTempWorkspace(async () => {
    const mediaRoute = await importFresh<typeof import("../src/app/api/admin/media/route")>("src/app/api/admin/media/route.ts")
    const tinyPngBuffer = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: { r: 24, g: 64, b: 160 },
      },
    })
      .png()
      .toBuffer()

    const cookie = buildSessionCookie(createSessionToken())
    const formData = new FormData()
    formData.append("file", new File([tinyPngBuffer], "proof-a.png", { type: "image/png" }))
    formData.append("file", new File([tinyPngBuffer], "proof-b.png", { type: "image/png" }))

    const request = new NextRequest("https://champion.cc.cd/api/admin/media", {
      method: "POST",
      headers: { cookie },
      body: formData,
    })
    const response = await mediaRoute.POST(request)
    const payload = await response.json()

    assert.equal(response.status, 201)
    assert.equal(Array.isArray(payload.assets), true)
    assert.equal(payload.assets.length, 2)
    assert.equal(Array.isArray(payload.failures), true)
    assert.equal(payload.failures.length, 0)
  })
})

test("admin media routes can batch delete files in one request", async () => {
  await withTempWorkspace(async () => {
    const mediaRoute = await importFresh<typeof import("../src/app/api/admin/media/route")>("src/app/api/admin/media/route.ts")
    const tinyPngBuffer = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: { r: 200, g: 80, b: 120 },
      },
    })
      .png()
      .toBuffer()

    const cookie = buildSessionCookie(createSessionToken())
    const uploadFormData = new FormData()
    uploadFormData.append("file", new File([tinyPngBuffer], "delete-a.png", { type: "image/png" }))
    uploadFormData.append("file", new File([tinyPngBuffer], "delete-b.png", { type: "image/png" }))

    const uploadResponse = await mediaRoute.POST(
      new NextRequest("https://champion.cc.cd/api/admin/media", {
        method: "POST",
        headers: { cookie },
        body: uploadFormData,
      })
    )
    const uploadPayload = await uploadResponse.json()
    const uploadedIds = uploadPayload.assets.map((asset: { id: string }) => asset.id)

    const deleteResponse = await mediaRoute.DELETE(
      new NextRequest("https://champion.cc.cd/api/admin/media", {
        method: "DELETE",
        headers: {
          cookie,
          "content-type": "application/json",
        },
        body: JSON.stringify({ ids: uploadedIds }),
      })
    )
    const deletePayload = await deleteResponse.json()

    assert.equal(deleteResponse.status, 200)
    assert.deepEqual(deletePayload.deletedIds, uploadedIds)
    assert.equal(deletePayload.failedIds.length, 0)
    assert.equal(deletePayload.missingIds.length, 0)
  })
})

test("admin media routes reject unreadable image buffers in an isolated workspace", async () => {
  await withTempWorkspace(async () => {
    const mediaRoute = await importFresh<typeof import("../src/app/api/admin/media/route")>("src/app/api/admin/media/route.ts")
    const cookie = buildSessionCookie(createSessionToken())
    const formData = new FormData()
    formData.append("file", new File([Buffer.from("not-a-real-png")], "broken.png", { type: "image/png" }))

    const request = new NextRequest("https://champion.cc.cd/api/admin/media", {
      method: "POST",
      headers: { cookie },
      body: formData,
    })
    const response = await mediaRoute.POST(request)
    const payload = await response.json()

    assert.equal(response.status, 400)
    assert.match(payload.error, /无法解析/)
  })
})

test("comment user registration route creates a user and session cookie in an isolated workspace", async () => {
  await withTempWorkspace(async () => {
    const registerRoute = await importFresh<typeof import("../src/app/api/user/register/route")>("src/app/api/user/register/route.ts")
    const store = await importFresh<typeof import("../src/lib/server/store")>("src/lib/server/store.ts")

    const request = new NextRequest("https://champion.cc.cd/api/user/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "route_user",
        displayName: "路由用户",
        password: "12345678",
      }),
    })

    const response = await registerRoute.POST(request)
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(payload.username, "route_user")
    assert.equal(payload.displayName, "路由用户")
    assert.match(String(response.headers.get("set-cookie")), /user_session=/)

    const created = await store.getUserByUsername("route_user")
    assert.equal(created?.username, "route_user")
    assert.equal(created?.display_name, "路由用户")
  })
})

test("comment user login route rate-limits repeated failed attempts in an isolated workspace", async () => {
  await withTempWorkspace(async () => {
    const registerRoute = await importFresh<typeof import("../src/app/api/user/register/route")>("src/app/api/user/register/route.ts")
    const loginRoute = await importFresh<typeof import("../src/app/api/user/login/route")>("src/app/api/user/login/route.ts")

    await registerRoute.POST(
      new NextRequest("https://champion.cc.cd/api/user/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: "limited_user",
          displayName: "受限用户",
          password: "12345678",
        }),
      })
    )

    for (let index = 0; index < 5; index += 1) {
      const request = new NextRequest("https://champion.cc.cd/api/user/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-real-ip": "198.51.100.21",
        },
        body: JSON.stringify({
          username: "limited_user",
          password: "wrong-password",
        }),
      })
      const response = await loginRoute.POST(request)
      assert.equal(response.status, 401)
    }

    const blockedRequest = new NextRequest("https://champion.cc.cd/api/user/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": "198.51.100.21",
      },
      body: JSON.stringify({
        username: "limited_user",
        password: "wrong-password",
      }),
    })
    const blockedResponse = await loginRoute.POST(blockedRequest)
    const blockedPayload = await blockedResponse.json()

    assert.equal(blockedResponse.status, 429)
    assert.match(blockedPayload.error, /登录尝试过于频繁/)
  })
})

test("comment user registration route rate-limits repeated attempts in an isolated workspace", async () => {
  await withTempWorkspace(async () => {
    const registerRoute = await importFresh<typeof import("../src/app/api/user/register/route")>("src/app/api/user/register/route.ts")

    for (let index = 0; index < 4; index += 1) {
      const request = new NextRequest("https://champion.cc.cd/api/user/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-real-ip": "198.51.100.22",
        },
        body: JSON.stringify({
          username: `register_user_${index}`,
          displayName: `注册用户${index}`,
          password: "12345678",
        }),
      })
      const response = await registerRoute.POST(request)
      assert.equal(response.status, 200)
    }

    const blockedRequest = new NextRequest("https://champion.cc.cd/api/user/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": "198.51.100.22",
      },
      body: JSON.stringify({
        username: "register_u5",
        displayName: "注册用户5",
        password: "12345678",
      }),
    })
    const blockedResponse = await registerRoute.POST(blockedRequest)
    const blockedPayload = await blockedResponse.json()

    assert.equal(blockedResponse.status, 429)
    assert.match(blockedPayload.error, /注册尝试过于频繁/)
  })
})

test("admin login route rate-limits repeated failed attempts in an isolated workspace", async () => {
  await withTempWorkspace(async () => {
    const loginRoute = await importFresh<typeof import("../src/app/api/auth/login/route")>("src/app/api/auth/login/route.ts")

    for (let index = 0; index < 5; index += 1) {
      const request = new NextRequest("https://champion.cc.cd/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-real-ip": "198.51.100.10",
        },
        body: JSON.stringify({ password: "wrong-password" }),
      })
      const response = await loginRoute.POST(request)
      assert.equal(response.status, 401)
    }

    const blockedRequest = new NextRequest("https://champion.cc.cd/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": "198.51.100.10",
      },
      body: JSON.stringify({ password: "wrong-password" }),
    })
    const blockedResponse = await loginRoute.POST(blockedRequest)
    const blockedPayload = await blockedResponse.json()

    assert.equal(blockedResponse.status, 429)
    assert.match(blockedPayload.error, /登录尝试过于频繁/)
  })
})

test("comment route rate-limits repeated posts in an isolated workspace", async () => {
  await withTempWorkspace(async () => {
    const commentsRoute = await importFresh<typeof import("../src/app/api/comments/[postId]/route")>("src/app/api/comments/[postId]/route.ts")

    for (let index = 0; index < 4; index += 1) {
      const request = new NextRequest("https://champion.cc.cd/api/comments/welcome", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-real-ip": "198.51.100.11",
        },
        body: JSON.stringify({
          author: "游客",
          content: `这是一条测试评论 ${index + 1}`,
        }),
      })

      const response = await commentsRoute.POST(request, {
        params: Promise.resolve({ postId: "welcome" }),
      })
      assert.equal(response.status, 200)
    }

    const blockedRequest = new NextRequest("https://champion.cc.cd/api/comments/welcome", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": "198.51.100.11",
      },
      body: JSON.stringify({
        author: "游客",
        content: "这是一条测试评论 5",
      }),
    })

    const blockedResponse = await commentsRoute.POST(blockedRequest, {
      params: Promise.resolve({ postId: "welcome" }),
    })
    const blockedPayload = await blockedResponse.json()

    assert.equal(blockedResponse.status, 429)
    assert.match(blockedPayload.error, /评论太快啦/)
  })
})
