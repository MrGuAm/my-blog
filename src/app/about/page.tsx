import type { Metadata } from "next"
import AboutClient from "./AboutClient"

export const metadata: Metadata = {
  title: "关于",
  description: "关于 Champion's Blog - 这是一个分享生活和技术的个人博客",
  openGraph: {
    title: "关于 | Champion's Blog",
    description: "关于 Champion's Blog - 这是一个分享生活和技术的个人博客",
  },
}

export default function AboutPage() {
  return <AboutClient />
}
