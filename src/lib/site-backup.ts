import type { Post } from "@/lib/posts"
import type { SiteSettings } from "@/lib/site-settings"
import type { CommentRecord, MediaAssetRecord, PostVersionRecord, RateLimitBucketRecord, UserMusicLibrary } from "@/lib/server/store"

export const SITE_SNAPSHOT_VERSION = 1

export interface SiteBackupUserRecord {
  id: string
  username: string
  displayName: string
  passwordHash: string
  bannedAt?: string | null
  banReason?: string | null
  createdAt: string
}

export interface SiteBackupCommentRecord extends CommentRecord {
  reviewedAt?: string | null
}

export interface SiteBackupMediaReference {
  postId: string
  assetId: string
  usageKind: "cover" | "content" | "cover+content"
}

export interface SiteBackupSiteSettingsRecord {
  settings: SiteSettings
  updatedAt?: string | null
}

export interface SiteBackupManifest {
  snapshotVersion: number
  exportedAt: string
  appVersion: string
  sourceDatabase: "sqlite" | "remote"
  brandName: string
  gitCommitSha?: string | null
  includesLocalUploads: boolean
  includesBlobObjects: boolean
  counts: {
    posts: number
    postVersions: number
    comments: number
    users: number
    userMusicLibraries: number
    mediaAssets: number
    mediaReferences: number
    rateLimitBuckets: number
  }
}

export interface SiteBackupSnapshot {
  manifest: SiteBackupManifest
  data: {
    posts: Post[]
    postVersions: PostVersionRecord[]
    comments: SiteBackupCommentRecord[]
    users: SiteBackupUserRecord[]
    userMusicLibraries: UserMusicLibrary[]
    mediaAssets: MediaAssetRecord[]
    mediaReferences: SiteBackupMediaReference[]
    siteSettings: SiteBackupSiteSettingsRecord
    rateLimitBuckets: RateLimitBucketRecord[]
  }
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

export function buildSiteSnapshotFileName(date = new Date()) {
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("")

  return `site-snapshot-${stamp}.json`
}
