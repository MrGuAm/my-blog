import type { Metadata } from "next"
import HomeClient from "./HomeClient"

export const metadata: Metadata = {
  title: "首页",
  description: "Champion's Blog - 记录生活，分享想法",
  openGraph: {
    title: "Champion's Blog",
    description: "记录生活，分享想法 - Champion 的个人博客",
  },
}

export default function HomePage() {
  return <HomeClient />
}
