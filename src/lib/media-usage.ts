export interface MediaUsageAssetLike {
  id: string
  url: string
  pathname?: string
}

export interface MediaUsagePostLike {
  id: string
  title: string
  slug?: string
  draft?: boolean
  content: string
  coverImage?: string
}

export interface MediaUsageReference {
  postId: string
  postTitle: string
  postSlug?: string
  draft: boolean
  kind: "cover" | "content" | "cover+content"
}

export type MediaUsageScope = "unused" | "cover" | "content" | "mixed"

export interface MediaUsageDetails {
  count: number
  posts: MediaUsageReference[]
}

export function countMediaAssetUsage(
  assets: MediaUsageAssetLike[],
  posts: MediaUsagePostLike[]
) {
  const usage = new Map<string, number>()

  for (const asset of assets) {
    let count = 0
    for (const post of posts) {
      const usesAsCover = Boolean(post.coverImage && post.coverImage === asset.url)
      const usesInContent =
        post.content.includes(asset.url) ||
        Boolean(asset.pathname && post.content.includes(asset.pathname))

      if (usesAsCover || usesInContent) {
        count += 1
      }
    }
    usage.set(asset.id, count)
  }

  return usage
}

export function describeMediaAssetUsage(
  assets: MediaUsageAssetLike[],
  posts: MediaUsagePostLike[]
) {
  const usage = new Map<string, MediaUsageDetails>()

  for (const asset of assets) {
    const references: MediaUsageReference[] = []

    for (const post of posts) {
      const usesAsCover = Boolean(post.coverImage && post.coverImage === asset.url)
      const usesInContent =
        post.content.includes(asset.url) ||
        Boolean(asset.pathname && post.content.includes(asset.pathname))

      if (!usesAsCover && !usesInContent) continue

      references.push({
        postId: post.id,
        postTitle: post.title,
        postSlug: post.slug,
        draft: Boolean(post.draft),
        kind: usesAsCover && usesInContent ? "cover+content" : usesAsCover ? "cover" : "content",
      })
    }

    usage.set(asset.id, {
      count: references.length,
      posts: references,
    })
  }

  return usage
}

export function getMediaUsageHref(reference: Pick<MediaUsageReference, "postId" | "postSlug" | "draft">) {
  if (reference.draft) {
    return `/write/${reference.postId}`
  }

  return `/posts/${encodeURIComponent(reference.postSlug || reference.postId)}`
}

export function getMediaUsageScope(usagePosts?: MediaUsageReference[]): MediaUsageScope {
  if (!usagePosts || usagePosts.length === 0) return "unused"

  const hasCover = usagePosts.some((usage) => usage.kind === "cover" || usage.kind === "cover+content")
  const hasContent = usagePosts.some((usage) => usage.kind === "content" || usage.kind === "cover+content")

  if (hasCover && hasContent) return "mixed"
  if (hasCover) return "cover"
  if (hasContent) return "content"
  return "unused"
}
