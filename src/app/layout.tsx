import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { SpeedInsights } from '@vercel/speed-insights/next'
import StructuredDataScript from "@/components/StructuredDataScript"
import { MusicProvider } from "@/context/MusicContext"
import { buildRootMetadata, buildWebsiteStructuredData } from "@/lib/server/site-metadata"
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteStructuredData = await buildWebsiteStructuredData()

  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StructuredDataScript id="website-structured-data" data={websiteStructuredData} />
        <MusicProvider>
          {children}
        </MusicProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
