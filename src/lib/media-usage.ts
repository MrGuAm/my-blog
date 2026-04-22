export interface MediaUsageAssetLike {
  id: string
  url: string
  pathname?: string
}

export interface MediaUsagePostLike {
  id: string
  content: string
  coverImage?: string
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
