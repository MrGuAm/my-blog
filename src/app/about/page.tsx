import type { Metadata } from "next"
import StructuredDataScript from "@/components/StructuredDataScript"
import { buildAboutStructuredData, getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { getSiteSettings } from "@/lib/server/site-settings"
import AboutClient from "./AboutClient"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "关于",
    description: settings.aboutMetaDescription,
    openGraph: {
      title: `关于 | ${settings.brandName}`,
      description: settings.aboutMetaDescription,
    },
  }
}

export default async function AboutPage() {
  const [siteSettings, aboutStructuredData] = await Promise.all([
    getSiteSettings(),
    buildAboutStructuredData(),
  ])

  return (
    <>
      <StructuredDataScript id="about-structured-data" data={aboutStructuredData} />
      <AboutClient siteSettings={siteSettings} />
    </>
  )
}
