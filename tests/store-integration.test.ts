import test from "node:test"
import assert from "node:assert/strict"
import { importFresh, withTempWorkspace } from "./helpers/temp-workspace"

test("store integration supports create, update, versioning, and delete in an isolated sqlite workspace", async () => {
  await withTempWorkspace(async () => {
    const store = await importFresh<typeof import("../src/lib/server/store")>("src/lib/server/store.ts")

    const created = await store.createPost({
      title: "测试文章",
      content: "<p>Hello integration test</p>",
      category: "技术",
      tags: ["测试", "集成"],
      coverImage: "/uploads/example.svg",
      pinned: true,
      featured: true,
      series: "工程化改造",
      seriesOrder: 2,
    })

    assert.ok(created.id)
    assert.equal(created.slug, "测试文章")
    assert.equal(created.pinned, true)
    assert.equal(created.featured, true)
    assert.equal(created.series, "工程化改造")
    assert.equal(created.seriesOrder, 2)

    const fetched = await store.getPostById(created.id)
    assert.equal(fetched?.title, "测试文章")
    assert.deepEqual(fetched?.tags, ["测试", "集成"])
    assert.equal(fetched?.featured, true)
    assert.equal(fetched?.series, "工程化改造")
    assert.equal(fetched?.seriesOrder, 2)

    const initialVersions = await store.listPostVersions(created.id)
    assert.equal(initialVersions.length, 1)
    assert.equal(initialVersions[0]?.note, "初始版本")

    const updated = await store.updatePost(created.id, {
      title: "测试文章-已更新",
      content: "<p>Updated</p>",
      tags: ["测试", "更新"],
      seriesOrder: 3,
      draft: true,
    })

    assert.equal(updated?.title, "测试文章-已更新")
    assert.equal(updated?.draft, true)
    assert.deepEqual(updated?.tags, ["测试", "更新"])
    assert.equal(updated?.seriesOrder, 3)

    const nextVersions = await store.listPostVersions(created.id)
    assert.equal(nextVersions.length, 2)
    assert.equal(nextVersions[0]?.note, "保存草稿")

    const deleted = await store.deletePost(created.id)
    assert.equal(deleted, true)
    const afterDelete = await store.getPostById(created.id)
    assert.equal(afterDelete, undefined)
  })
})

test("media integration supports local save, list, and delete in an isolated workspace", async () => {
  await withTempWorkspace(async () => {
    const media = await importFresh<typeof import("../src/lib/server/media")>("src/lib/server/media.ts")

    const file = new File(["media-proof"], "proof.png", { type: "image/png" })
    const saved = await media.saveMediaFile(file)

    assert.equal(saved.storage, "local")
    assert.equal(saved.deletable, true)
    assert.match(saved.url, /\/uploads\//)

    const listed = await media.listMediaAssets()
    assert.ok(listed.some((asset) => asset.id === saved.id))

    const deleted = await media.deleteMediaFile(saved.id)
    assert.equal(deleted, true)

    const afterDelete = await media.listMediaAssets()
    assert.equal(afterDelete.some((asset) => asset.id === saved.id), false)
  })
})
