import { revalidateTag, unstable_cache } from 'next/cache'
import { getPostById, getPostBySlug, listPosts, listRecentComments } from '@/lib/server/store'

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

export function invalidatePostsCache() {
  revalidateTag(CACHE_TAGS.posts, 'max')
}

export function invalidateCommentsCache() {
  revalidateTag(CACHE_TAGS.comments, 'max')
}

export function invalidateMusicCache() {
  revalidateTag(CACHE_TAGS.music, 'max')
}
