export const siteConfig = {
  name: "Champion's Blog",
  titleTemplate: "%s | Champion's Blog",
  description: "记录生活，分享想法 - Champion 的个人博客",
  url: "https://champion.cc.cd",
  locale: "zh_CN",
  language: "zh-CN",
  author: "Champion",
  twitterHandle: "@champion",
  keywords: ["博客", "随笔", "技术", "生活", "React", "前端"],
  rssPath: "/api/feed",
  ogImage: "/opengraph-image",
} as const

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return new URL(normalizedPath, siteConfig.url).toString()
}
