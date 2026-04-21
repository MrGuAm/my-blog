"use client"

import { PaletteBadge, paletteTones } from "@/components/PaletteCharacters"
import PrimaryNavLinks from "@/components/PrimaryNavLinks"
import SiteBrand from "@/components/SiteBrand"
import SiteFooter from "@/components/SiteFooter"
import type { SiteSettings } from "@/lib/site-settings"

export default function AboutClient({ siteSettings }: { siteSettings: SiteSettings }) {
  const aboutHighlights = [
    { title: "关键词", copy: siteSettings.aboutHighlightKeywords },
    { title: "写作感觉", copy: siteSettings.aboutHighlightStyle },
    { title: "想留下的", copy: siteSettings.aboutHighlightGoal },
  ]
  const aboutSections = [
    {
      title: siteSettings.aboutSectionOneTitle,
      copy: siteSettings.aboutSectionOneCopy,
      tone: paletteTones[3],
    },
    {
      title: siteSettings.aboutSectionTwoTitle,
      copy: siteSettings.aboutSectionTwoCopy,
      tone: paletteTones[1],
    },
    {
      title: siteSettings.aboutSectionThreeTitle,
      copy: siteSettings.aboutSectionThreeCopy,
      tone: paletteTones[0],
    },
    {
      title: siteSettings.aboutSectionFourTitle,
      copy: siteSettings.aboutSectionFourCopy,
      tone: paletteTones[2],
    },
  ]
  const contactLinks = [
    siteSettings.contactEmail
      ? {
          label: "邮箱",
          value: siteSettings.contactEmail,
          href: `mailto:${siteSettings.contactEmail}`,
        }
      : null,
    siteSettings.githubUrl
      ? {
          label: "GitHub",
          value: siteSettings.githubUrl.replace(/^https?:\/\//, ""),
          href: siteSettings.githubUrl,
        }
      : null,
    siteSettings.xProfileUrl
      ? {
          label: "X",
          value: siteSettings.xProfileUrl.replace(/^https?:\/\//, ""),
          href: siteSettings.xProfileUrl,
        }
      : null,
    siteSettings.primaryLinkUrl
      ? {
          label: siteSettings.primaryLinkLabel,
          value: siteSettings.primaryLinkUrl.replace(/^https?:\/\//, ""),
          href: siteSettings.primaryLinkUrl,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string }>

  return (
    <div className="min-h-screen text-foreground">
      {/* Navigation */}
      <nav className="apple-nav sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SiteBrand label={siteSettings.brandName} />
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <PrimaryNavLinks active="about" />
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        {/* About Content */}
        <div className="space-y-8">
          <section className="editorial-card sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="section-kicker">{siteSettings.aboutKicker}</span>
                <h1 className="mt-4 text-[2.1rem] font-semibold tracking-[-0.08em] sm:text-[2.6rem]">{siteSettings.aboutTitle}</h1>
                <p className="section-copy mt-3">
                  {siteSettings.aboutDescription}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <PaletteBadge tone={paletteTones[0].tone} mouthTone={paletteTones[0].mouthTone} mood={paletteTones[0].mood} />
                <PaletteBadge tone={paletteTones[2].tone} mouthTone={paletteTones[2].mouthTone} mood={paletteTones[2].mood} />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {aboutHighlights.map((item) => (
              <div key={item.title} className="editorial-card-soft rounded-[1.75rem]">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.title}</p>
                <p className="mt-3 text-lg font-semibold">{item.copy}</p>
              </div>
            ))}
          </section>

          {aboutSections.map((section) => (
            <section key={section.title} className="editorial-card-soft">
              <div className="mb-3 flex items-center gap-3">
                <PaletteBadge tone={section.tone.tone} mouthTone={section.tone.mouthTone} mood={section.tone.mood} />
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <p className="text-muted-foreground">{section.copy}</p>
            </section>
          ))}

          {contactLinks.length > 0 ? (
            <section className="editorial-card-soft">
              <div className="mb-4 flex items-center gap-3">
                <PaletteBadge tone={paletteTones[2].tone} mouthTone={paletteTones[2].mouthTone} mood={paletteTones[2].mood} />
                <h2 className="text-xl font-bold">联系与外链</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {contactLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="rounded-[1.5rem] border border-border/50 bg-background/60 px-4 py-4 transition-colors hover:border-primary/50 hover:bg-accent/20"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                    <p className="mt-2 break-all text-sm font-medium">{item.value}</p>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
      {/* Footer */}
      <SiteFooter text={siteSettings.footerText} />
    </div>
  )
}
