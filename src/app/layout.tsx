import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { SpeedInsights } from '@vercel/speed-insights/next'
import { MusicProvider } from "@/context/MusicContext"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://my-blog-amber-chi.vercel.app"),
  title: {
    default: "Champion's Blog",
    template: "%s | Champion's Blog",
  },
  description: "记录生活，分享想法 - Champion 的个人博客",
  keywords: ["博客", "随笔", "技术", "生活", "React", "前端"],
  authors: [{ name: "Champion" }],
  creator: "Champion",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://my-blog-amber-chi.vercel.app",
    siteName: "Champion's Blog",
    title: "Champion's Blog",
    description: "记录生活，分享想法 - Champion 的个人博客",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Champion's Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Champion's Blog",
    description: "记录生活，分享想法 - Champion 的个人博客",
    images: ["/og-image.svg"],
    creator: "@champion",
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%236C3FF5'/%3E%3Ctext x='50' y='68' font-size='55' font-family='Arial' font-weight='bold' text-anchor='middle' fill='white'%3EC%3C/text%3E%3C/svg%3E",
  },
  alternates: {
    types: {
      "application/rss+xml": "/api/feed",
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MusicProvider>
          {children}
        </MusicProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
