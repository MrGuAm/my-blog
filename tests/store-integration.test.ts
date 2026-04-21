import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

const repoRoot = "/Users/guanchengbin/.openclaw/workspace/my-blog"

function resetStoreGlobals() {
  const target = globalThis as Record<string, unknown>
  target.__championBlogDb = undefined
  target.__championBlogSql = undefined
  target.__championBlogStoreReady = undefined
}

async function withTempWorkspace<T>(run: (workspaceDir: string) => Promise<T>) {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "myblog-store-"))
  const dataDir = path.join(workspaceDir, "data")
  const postsDir = path.join(dataDir, "posts")
  const uploadsDir = path.join(workspaceDir, "public", "uploads")
  fs.mkdirSync(postsDir, { recursive: true })
  fs.mkdirSync(uploadsDir, { recursive: true })
  fs.copyFileSync(path.join(repoRoot, "data", "posts", "posts.json"), path.join(postsDir, "posts.json"))
  fs.copyFileSync(path.join(repoRoot, "data", "comments.json"), path.join(dataDir, "comments.json"))

  const previousEnv = {
    BLOG_DATA_DIR: process.env.BLOG_DATA_DIR,
    BLOG_DB_PATH: process.env.BLOG_DB_PATH,
    BLOG_POSTS_JSON_PATH: process.env.BLOG_POSTS_JSON_PATH,
    BLOG_COMMENTS_JSON_PATH: process.env.BLOG_COMMENTS_JSON_PATH,
    BLOG_MEDIA_DIR: process.env.BLOG_MEDIA_DIR,
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL: process.env.VERCEL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  }

  process.env.BLOG_DATA_DIR = dataDir
  process.env.BLOG_DB_PATH = path.join(dataDir, "blog.db")
  process.env.BLOG_POSTS_JSON_PATH = path.join(postsDir, "posts.json")
  process.env.BLOG_COMMENTS_JSON_PATH = path.join(dataDir, "comments.json")
  process.env.BLOG_MEDIA_DIR = uploadsDir
  delete process.env.DATABASE_URL
  delete process.env.VERCEL
  delete process.env.BLOB_READ_WRITE_TOKEN
  resetStoreGlobals()

  try {
    return await run(workspaceDir)
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
    resetStoreGlobals()
    fs.rmSync(workspaceDir, { recursive: true, force: true })
  }
}

async function importFresh<T>(relativePath: string): Promise<T> {
  const absolutePath = path.join(repoRoot, relativePath)
  return (await import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}-${Math.random()}`)) as T
}

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
    })

    assert.ok(created.id)
    assert.equal(created.slug, "测试文章")
    assert.equal(created.pinned, true)

    const fetched = await store.getPostById(created.id)
    assert.equal(fetched?.title, "测试文章")
    assert.deepEqual(fetched?.tags, ["测试", "集成"])

    const initialVersions = await store.listPostVersions(created.id)
    assert.equal(initialVersions.length, 1)
    assert.equal(initialVersions[0]?.note, "初始版本")

    const updated = await store.updatePost(created.id, {
      title: "测试文章-已更新",
      content: "<p>Updated</p>",
      tags: ["测试", "更新"],
      draft: true,
    })

    assert.equal(updated?.title, "测试文章-已更新")
    assert.equal(updated?.draft, true)
    assert.deepEqual(updated?.tags, ["测试", "更新"])

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
