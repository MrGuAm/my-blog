import { revalidateTag, unstable_cache } from 'next/cache'
import { listRecentComments } from '@/lib/server/comments'
import { getPostById, getPostBySlug, listPosts } from '@/lib/server/store'

export const CACHE_TAGS = {
  posts: 'posts',
  comments: 'comments',
  music: 'music',
} as const

export const getCachedPublicPosts = unstable_cache(
  async () =>
    (await listPosts({ includeDrafts: false })).map((post) => ({
      ...post,
      content: '',
    })),
  ['public-posts'],
  { tags: [CACHE_TAGS.posts], revalidate: 300 }
)

export const getCachedRecentComments = unstable_cache(
  async () => listRecentComments(10),
  ['recent-comments'],
  { tags: [CACHE_TAGS.comments], revalidate: 120 }
)

export const getCachedPublicPost = unstable_cache(
  async (idOrSlug: string) => {
    const post = (await getPostById(idOrSlug)) || (await getPostBySlug(idOrSlug))
    return post && !post.draft ? post : null
  },
  ['public-post-detail'],
  { tags: [CACHE_TAGS.posts], revalidate: 300 }
)

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag, 'max')
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('static generation store missing')
    ) {
      return
    }
    throw error
  }
}

export function invalidatePostsCache() {
  safeRevalidateTag(CACHE_TAGS.posts)
}

export function invalidateCommentsCache() {
  safeRevalidateTag(CACHE_TAGS.comments)
}

export function invalidateMusicCache() {
  safeRevalidateTag(CACHE_TAGS.music)
}
