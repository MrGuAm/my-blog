import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

export const repoRoot = path.resolve(process.cwd())

export function resetStoreGlobals() {
  const target = globalThis as Record<string, unknown>
  target.__championBlogDb = undefined
  target.__championBlogSql = undefined
  target.__championBlogStoreReady = undefined
}

export async function withTempWorkspace<T>(
  run: (workspaceDir: string) => Promise<T>,
  overrides?: Partial<Record<string, string>>
) {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "myblog-store-"))
  const dataDir = path.join(workspaceDir, "data")
  const postsDir = path.join(dataDir, "posts")
  const uploadsDir = path.join(workspaceDir, "public", "uploads")
  const musicDir = path.join(workspaceDir, "public", "music")

  fs.mkdirSync(postsDir, { recursive: true })
  fs.mkdirSync(uploadsDir, { recursive: true })
  fs.mkdirSync(musicDir, { recursive: true })
  fs.copyFileSync(path.join(repoRoot, "data", "posts", "posts.json"), path.join(postsDir, "posts.json"))
  fs.copyFileSync(path.join(repoRoot, "data", "comments.json"), path.join(dataDir, "comments.json"))

  const previousEnv = {
    BLOG_DATA_DIR: process.env.BLOG_DATA_DIR,
    BLOG_DB_PATH: process.env.BLOG_DB_PATH,
    BLOG_POSTS_JSON_PATH: process.env.BLOG_POSTS_JSON_PATH,
    BLOG_COMMENTS_JSON_PATH: process.env.BLOG_COMMENTS_JSON_PATH,
    BLOG_MEDIA_DIR: process.env.BLOG_MEDIA_DIR,
    BLOG_MUSIC_DIR: process.env.BLOG_MUSIC_DIR,
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL: process.env.VERCEL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    AUTH_PASSWORD: process.env.AUTH_PASSWORD,
    AUTH_SECRET: process.env.AUTH_SECRET,
  }

  process.env.BLOG_DATA_DIR = dataDir
  process.env.BLOG_DB_PATH = path.join(dataDir, "blog.db")
  process.env.BLOG_POSTS_JSON_PATH = path.join(postsDir, "posts.json")
  process.env.BLOG_COMMENTS_JSON_PATH = path.join(dataDir, "comments.json")
  process.env.BLOG_MEDIA_DIR = uploadsDir
  process.env.BLOG_MUSIC_DIR = musicDir
  delete process.env.DATABASE_URL
  delete process.env.VERCEL
  delete process.env.BLOB_READ_WRITE_TOKEN
  process.env.AUTH_PASSWORD = overrides?.AUTH_PASSWORD || "integration-admin"
  process.env.AUTH_SECRET = overrides?.AUTH_SECRET || "integration-secret"
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

export async function importFresh<T>(relativePath: string): Promise<T> {
  const absolutePath = path.join(repoRoot, relativePath)
  return (await import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}-${Math.random()}`)) as T
}
