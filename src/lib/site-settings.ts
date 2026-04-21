import { siteConfig } from "@/lib/site-config"

export interface SiteSettings {
  brandName: string
  footerText: string
  homeKicker: string
  homeTitle: string
  homeDescription: string
  aboutKicker: string
  aboutTitle: string
  aboutDescription: string
  aboutHighlightKeywords: string
  aboutHighlightStyle: string
  aboutHighlightGoal: string
}

export const defaultSiteSettings: SiteSettings = {
  brandName: siteConfig.name,
  footerText: `© 2026 ${siteConfig.name}`,
  homeKicker: siteConfig.name,
  homeTitle: "干净一点，轻松一点，也更有自己的样子。",
  homeDescription: "保持白色基底，用少量柔和彩色元素提气，不会太冷，也不会太花，整体更像一个干净但有个性的个人博客。",
  aboutKicker: "About Champion",
  aboutTitle: "关于我。",
  aboutDescription: "这里记录我正在做的事、喜欢的内容，以及这个博客为什么会长成现在这个样子。",
  aboutHighlightKeywords: "技术、音乐、生活",
  aboutHighlightStyle: "轻一点，真一点",
  aboutHighlightGoal: "长期可回看的内容",
}

function normalizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

export function normalizeSiteSettings(input?: Partial<SiteSettings> | null): SiteSettings {
  const source = input || {}
  return {
    brandName: normalizeText(source.brandName, defaultSiteSettings.brandName),
    footerText: normalizeText(source.footerText, defaultSiteSettings.footerText),
    homeKicker: normalizeText(source.homeKicker, defaultSiteSettings.homeKicker),
    homeTitle: normalizeText(source.homeTitle, defaultSiteSettings.homeTitle),
    homeDescription: normalizeText(source.homeDescription, defaultSiteSettings.homeDescription),
    aboutKicker: normalizeText(source.aboutKicker, defaultSiteSettings.aboutKicker),
    aboutTitle: normalizeText(source.aboutTitle, defaultSiteSettings.aboutTitle),
    aboutDescription: normalizeText(source.aboutDescription, defaultSiteSettings.aboutDescription),
    aboutHighlightKeywords: normalizeText(source.aboutHighlightKeywords, defaultSiteSettings.aboutHighlightKeywords),
    aboutHighlightStyle: normalizeText(source.aboutHighlightStyle, defaultSiteSettings.aboutHighlightStyle),
    aboutHighlightGoal: normalizeText(source.aboutHighlightGoal, defaultSiteSettings.aboutHighlightGoal),
  }
}
