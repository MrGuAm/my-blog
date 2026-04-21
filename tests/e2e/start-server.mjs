import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"

const repoRoot = process.cwd()
const port = process.env.PLAYWRIGHT_PORT || "3101"
const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "myblog-e2e-"))
const dataDir = path.join(workspaceDir, "data")
const postsDir = path.join(dataDir, "posts")
const uploadsDir = path.join(workspaceDir, "public", "uploads")

fs.mkdirSync(postsDir, { recursive: true })
fs.mkdirSync(uploadsDir, { recursive: true })
fs.copyFileSync(path.join(repoRoot, "data", "posts", "posts.json"), path.join(postsDir, "posts.json"))
fs.copyFileSync(path.join(repoRoot, "data", "comments.json"), path.join(dataDir, "comments.json"))

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "start", "-H", "127.0.0.1", "-p", port],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      BLOG_DATA_DIR: dataDir,
      BLOG_DB_PATH: path.join(dataDir, "blog.db"),
      BLOG_POSTS_JSON_PATH: path.join(postsDir, "posts.json"),
      BLOG_COMMENTS_JSON_PATH: path.join(dataDir, "comments.json"),
      BLOG_MEDIA_DIR: uploadsDir,
      AUTH_PASSWORD: "integration-admin",
      AUTH_SECRET: "integration-secret",
      DATABASE_URL: "",
      VERCEL: "",
      BLOB_READ_WRITE_TOKEN: "",
      NODE_ENV: "production",
    },
  }
)

function cleanupAndExit(code = 0) {
  try {
    if (!child.killed) {
      child.kill("SIGTERM")
    }
  } catch {}

  try {
    fs.rmSync(workspaceDir, { recursive: true, force: true })
  } catch {}

  process.exit(code)
}

child.on("exit", (code) => {
  cleanupAndExit(code ?? 0)
})

process.on("SIGINT", () => cleanupAndExit(130))
process.on("SIGTERM", () => cleanupAndExit(143))
