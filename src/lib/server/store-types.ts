import type { Post } from '@/lib/posts'

export interface CommentRecord {
  id: string
  postId: string
  author: string
  content: string
  date: string
  userId?: string | null
  parentCommentId?: string | null
  isAdmin?: boolean
  status?: CommentStatus
  moderationNote?: string | null
}

export type CommentStatus = 'pending' | 'approved' | 'rejected'

export interface PostVersionRecord {
  id: string
  postId: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  coverImage?: string
  bgmSrc?: string
  pinned?: boolean
  featured?: boolean
  draft?: boolean
  series?: string
  seriesOrder?: number | null
  createdAt: string
  note?: string
}

export interface PostRow {
  id: string
  slug?: string | null
  title: string
  excerpt: string
  date: string
  category: string
  tags_json: string
  content: string
  cover_image?: string | null
  bgm_src?: string | null
  pinned: number | boolean
  featured?: number | boolean | null
  draft: number | boolean
  series?: string | null
  series_order?: number | null
  views: number
  updated_at?: string | null
}

export interface PostVersionRow {
  id: string
  post_id: string
  title: string
  excerpt: string
  content: string
  category: string
  tags_json: string
  cover_image?: string | null
  bgm_src?: string | null
  pinned: number | boolean
  featured?: number | boolean | null
  draft: number | boolean
  series?: string | null
  series_order?: number | null
  created_at: string
  note?: string | null
}

export interface UserRow {
  id: string
  username: string
  display_name: string
  password_hash: string
  banned_at?: string | null
  ban_reason?: string | null
  created_at: string
}

export interface UserRecord {
  id: string
  username: string
  displayName: string
  isBanned: boolean
  bannedAt?: string | null
  banReason?: string | null
  createdAt: string
}

export interface UserMusicRow {
  user_id: string
  favorite_srcs_json: string
  recent_srcs_json: string
  last_track_src?: string | null
  last_track_time?: number | null
  updated_at: string
}

export interface UserMusicLibrary {
  userId: string
  favoriteSrcs: string[]
  recentSrcs: string[]
  lastTrackSrc?: string | null
  lastTrackTime?: number | null
  updatedAt: string
}

export interface MusicTrackRow {
  id: string
  name: string
  pathname: string
  url: string
  storage: string
  content_type: string
  size: number
  title: string
  artist: string
  album?: string | null
  cover_url?: string | null
  lyrics?: string | null
  uploaded_at: string
  updated_at: string
}

export interface MusicTrackRecord {
  id: string
  name: string
  pathname: string
  url: string
  storage: "blob" | "local"
  contentType: string
  size: number
  title: string
  artist: string
  album?: string | null
  coverUrl?: string | null
  lyrics?: string | null
  uploadedAt: string
  updatedAt: string
}

export interface MediaAssetRow {
  id: string
  name: string
  pathname: string
  url: string
  storage: string
  content_type: string
  size: number
  width?: number | null
  height?: number | null
  uploaded_at: string
  updated_at: string
}

export interface MediaAssetRecord {
  id: string
  name: string
  pathname: string
  url: string
  storage: 'blob' | 'local'
  contentType: string
  size: number
  width?: number | null
  height?: number | null
  uploadedAt: string
  updatedAt: string
}

export interface RateLimitBucketRow {
  bucket: string
  scope: string
  actor_key: string
  count: number
  window_started_at: number
  updated_at: string
}

export interface RateLimitBucketRecord {
  bucket: string
  scope: string
  actorKey: string
  count: number
  windowStartedAt: number
  updatedAt: string
}

export interface CommentRow {
  id: string
  post_id: string
  author: string
  content: string
  date: string
  user_id?: string | null
  parent_comment_id?: string | null
  is_admin?: number | boolean | null
  status?: CommentStatus | null
  moderation_note?: string | null
  reviewed_at?: string | null
}

export function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date,
    category: row.category,
    tags: JSON.parse(row.tags_json || '[]') as string[],
    content: row.content,
    coverImage: row.cover_image || '',
    bgmSrc: row.bgm_src || '',
    pinned: Boolean(row.pinned),
    featured: Boolean(row.featured),
    draft: Boolean(row.draft),
    series: row.series || '',
    seriesOrder: typeof row.series_order === 'number' ? row.series_order : null,
    views: row.views || 0,
    updatedAt: row.updated_at || row.date,
  }
}

export function rowToPostVersion(row: PostVersionRow): PostVersionRecord {
  return {
    id: row.id,
    postId: row.post_id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    tags: JSON.parse(row.tags_json || '[]') as string[],
    coverImage: row.cover_image || '',
    bgmSrc: row.bgm_src || '',
    pinned: Boolean(row.pinned),
    featured: Boolean(row.featured),
    draft: Boolean(row.draft),
    series: row.series || '',
    seriesOrder: typeof row.series_order === 'number' ? row.series_order : null,
    createdAt: row.created_at,
    note: row.note || '',
  }
}

export function rowToComment(row: CommentRow): CommentRecord {
  return {
    id: row.id,
    postId: row.post_id,
    author: row.author,
    content: row.content,
    date: row.date,
    userId: row.user_id || null,
    parentCommentId: row.parent_comment_id || null,
    isAdmin: Boolean(row.is_admin),
    status: (row.status as CommentStatus | undefined) || 'approved',
    moderationNote: row.moderation_note || null,
  }
}

export function rowToUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    isBanned: Boolean(row.banned_at),
    bannedAt: row.banned_at || null,
    banReason: row.ban_reason || null,
    createdAt: row.created_at,
  }
}

export function rowToUserMusic(row: UserMusicRow): UserMusicLibrary {
  return {
    userId: row.user_id,
    favoriteSrcs: JSON.parse(row.favorite_srcs_json || '[]') as string[],
    recentSrcs: JSON.parse(row.recent_srcs_json || '[]') as string[],
    lastTrackSrc: row.last_track_src || null,
    lastTrackTime: typeof row.last_track_time === 'number' ? row.last_track_time : 0,
    updatedAt: row.updated_at,
  }
}

export function rowToMusicTrackRecord(row: MusicTrackRow): MusicTrackRecord {
  return {
    id: row.id,
    name: row.name,
    pathname: row.pathname,
    url: row.url,
    storage: row.storage === "blob" ? "blob" : "local",
    contentType: row.content_type,
    size: row.size,
    title: row.title,
    artist: row.artist,
    album: row.album || null,
    coverUrl: row.cover_url || null,
    lyrics: row.lyrics || null,
    uploadedAt: row.uploaded_at,
    updatedAt: row.updated_at,
  }
}

export function rowToMediaAsset(row: MediaAssetRow): MediaAssetRecord {
  return {
    id: row.id,
    name: row.name,
    pathname: row.pathname,
    url: row.url,
    storage: row.storage === 'local' ? 'local' : 'blob',
    contentType: row.content_type,
    size: row.size,
    width: typeof row.width === 'number' ? row.width : null,
    height: typeof row.height === 'number' ? row.height : null,
    uploadedAt: row.uploaded_at,
    updatedAt: row.updated_at,
  }
}

export function rowToRateLimitBucket(row: RateLimitBucketRow): RateLimitBucketRecord {
  return {
    bucket: row.bucket,
    scope: row.scope,
    actorKey: row.actor_key,
    count: row.count,
    windowStartedAt: row.window_started_at,
    updatedAt: row.updated_at,
  }
}
