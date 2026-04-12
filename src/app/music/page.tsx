import type { Metadata } from "next"
import MusicPageClient from "./MusicPageClient"

export const metadata: Metadata = {
  title: "音乐",
  description: "Champion's Blog 的音乐角落",
}

export default function MusicPage() {
  return <MusicPageClient />
}
