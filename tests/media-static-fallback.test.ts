import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import { NextRequest } from "next/server"
import { buildSessionCookie, createSessionToken } from "../src/lib/server/auth"
import { importFresh, withTempWorkspace } from "./helpers/temp-workspace"

test("admin media routes list referenced local article images even when uploads directory is empty", async () => {
  await withTempWorkspace(async (workspaceDir) => {
    const uploadsDir = `${workspaceDir}/public/uploads`
    for (const fileName of await fs.readdir(uploadsDir)) {
      await fs.unlink(`${uploadsDir}/${fileName}`)
    }

    const mediaRoute = await importFresh<typeof import("../src/app/api/admin/media/route")>("src/app/api/admin/media/route.ts")
    const cookie = buildSessionCookie(createSessionToken())

    const listRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
      headers: { cookie },
    })
    const listResponse = await mediaRoute.GET(listRequest)
    const listPayload = await listResponse.json()

    assert.equal(listResponse.status, 200)
    assert.equal(Array.isArray(listPayload.assets), true)
    assert.equal(
      listPayload.assets.some((asset: { pathname?: string; storage?: string }) =>
        asset.pathname === "essay-morning-desk.svg" &&
        asset.storage === "local"
      ),
      true
    )
  })
})
