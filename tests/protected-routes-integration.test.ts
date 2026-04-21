import test from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"
import { buildSessionCookie, createSessionToken } from "../src/lib/server/auth"
import { importFresh, withTempWorkspace } from "./helpers/temp-workspace"

test("admin media routes can upload, list, and delete a file in an isolated workspace", async () => {
  await withTempWorkspace(async () => {
    const mediaRoute = await importFresh<typeof import("../src/app/api/admin/media/route")>("src/app/api/admin/media/route.ts")

    const cookie = buildSessionCookie(createSessionToken())
    const formData = new FormData()
    formData.append("file", new File(["proof"], "proof.png", { type: "image/png" }))

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
    assert.deepEqual(deletedPayload, { success: true })
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
