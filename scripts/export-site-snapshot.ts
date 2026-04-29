import fs from "node:fs"
import path from "node:path"
import { buildSiteSnapshotFileName } from "../src/lib/site-backup"

async function main() {
  const outputArg = process.argv[2]
  const timestamp = buildSiteSnapshotFileName().replace(".json", "")
  const outputDir = outputArg
    ? path.resolve(outputArg)
    : path.join(process.cwd(), "backups", timestamp)

  fs.mkdirSync(outputDir, { recursive: true })

  const { buildSiteBackupSnapshot } = await import("../src/lib/server/site-backup")

  const snapshot = await buildSiteBackupSnapshot()
  const snapshotPath = path.join(outputDir, "snapshot.json")
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), "utf-8")

  const localUploadsDir = process.env.BLOG_MEDIA_DIR || path.join(process.cwd(), "public", "uploads")
  if (fs.existsSync(localUploadsDir)) {
    fs.cpSync(localUploadsDir, path.join(outputDir, "uploads"), { recursive: true })
  }

  const localMusicDir = process.env.BLOG_MUSIC_DIR || path.join(process.cwd(), "public", "music")
  if (fs.existsSync(localMusicDir)) {
    fs.cpSync(localMusicDir, path.join(outputDir, "music"), { recursive: true })
  }

  console.log(`站点快照已导出到: ${snapshotPath}`)
}

main().catch((error) => {
  console.error("导出站点快照失败:", error)
  process.exit(1)
})
