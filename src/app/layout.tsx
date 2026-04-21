import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { SpeedInsights } from '@vercel/speed-insights/next'
import { MusicProvider } from "@/context/MusicContext"
import { buildRootMetadata } from "@/lib/server/site-metadata"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata()
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MusicProvider>
          {children}
        </MusicProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
