import { siteConfig } from "@/lib/site-config"

export interface SiteSettings {
  brandName: string
  footerText: string
  siteDescription: string
  aboutMetaDescription: string
  musicMetaDescription: string
  homeKicker: string
  homeTitle: string
  homeDescription: string
  aboutKicker: string
  aboutTitle: string
  aboutDescription: string
  aboutHighlightKeywords: string
  aboutHighlightStyle: string
  aboutHighlightGoal: string
  aboutSectionOneTitle: string
  aboutSectionOneCopy: string
  aboutSectionTwoTitle: string
  aboutSectionTwoCopy: string
  aboutSectionThreeTitle: string
  aboutSectionThreeCopy: string
  aboutSectionFourTitle: string
  aboutSectionFourCopy: string
}

export const defaultSiteSettings: SiteSettings = {
  brandName: siteConfig.name,
  footerText: `© 2026 ${siteConfig.name}`,
  siteDescription: siteConfig.description,
  aboutMetaDescription: `关于 ${siteConfig.name} - 这是一个分享生活和技术的个人博客`,
  musicMetaDescription: `${siteConfig.name} 的音乐角落`,
  homeKicker: siteConfig.name,
  homeTitle: "干净一点，轻松一点，也更有自己的样子。",
  homeDescription: "保持白色基底，用少量柔和彩色元素提气，不会太冷，也不会太花，整体更像一个干净但有个性的个人博客。",
  aboutKicker: "About Champion",
  aboutTitle: "关于我。",
  aboutDescription: "这里记录我正在做的事、喜欢的内容，以及这个博客为什么会长成现在这个样子。",
  aboutHighlightKeywords: "技术、音乐、生活",
  aboutHighlightStyle: "轻一点，真一点",
  aboutHighlightGoal: "长期可回看的内容",
  aboutSectionOneTitle: "🏠 这是什么博客?",
  aboutSectionOneCopy: "这是一个分享生活和技术的个人博客。记录我平时的想法、学习笔记和生活点滴。希望这些内容能对你有所帮助!",
  aboutSectionTwoTitle: "👨‍💻 我是谁?",
  aboutSectionTwoCopy: "我叫 Champion,一个热爱技术、喜欢音乐的开发者。平时喜欢折腾各种有趣的项目, 也喜欢听歌、写代码、分享经验。",
  aboutSectionThreeTitle: "🎯 我的目标",
  aboutSectionThreeCopy: "持续学习,持续输出。用博客记录成长,让知识留下痕迹。",
  aboutSectionFourTitle: "📬 联系我",
  aboutSectionFourCopy: "如果你有任何问题或建议,欢迎通过博客留言或发送邮件交流!",
}

function normalizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

export function normalizeSiteSettings(input?: Partial<SiteSettings> | null): SiteSettings {
  const source = input || {}
  return {
    brandName: normalizeText(source.brandName, defaultSiteSettings.brandName),
    footerText: normalizeText(source.footerText, defaultSiteSettings.footerText),
    siteDescription: normalizeText(source.siteDescription, defaultSiteSettings.siteDescription),
    aboutMetaDescription: normalizeText(source.aboutMetaDescription, defaultSiteSettings.aboutMetaDescription),
    musicMetaDescription: normalizeText(source.musicMetaDescription, defaultSiteSettings.musicMetaDescription),
    homeKicker: normalizeText(source.homeKicker, defaultSiteSettings.homeKicker),
    homeTitle: normalizeText(source.homeTitle, defaultSiteSettings.homeTitle),
    homeDescription: normalizeText(source.homeDescription, defaultSiteSettings.homeDescription),
    aboutKicker: normalizeText(source.aboutKicker, defaultSiteSettings.aboutKicker),
    aboutTitle: normalizeText(source.aboutTitle, defaultSiteSettings.aboutTitle),
    aboutDescription: normalizeText(source.aboutDescription, defaultSiteSettings.aboutDescription),
    aboutHighlightKeywords: normalizeText(source.aboutHighlightKeywords, defaultSiteSettings.aboutHighlightKeywords),
    aboutHighlightStyle: normalizeText(source.aboutHighlightStyle, defaultSiteSettings.aboutHighlightStyle),
    aboutHighlightGoal: normalizeText(source.aboutHighlightGoal, defaultSiteSettings.aboutHighlightGoal),
    aboutSectionOneTitle: normalizeText(source.aboutSectionOneTitle, defaultSiteSettings.aboutSectionOneTitle),
    aboutSectionOneCopy: normalizeText(source.aboutSectionOneCopy, defaultSiteSettings.aboutSectionOneCopy),
    aboutSectionTwoTitle: normalizeText(source.aboutSectionTwoTitle, defaultSiteSettings.aboutSectionTwoTitle),
    aboutSectionTwoCopy: normalizeText(source.aboutSectionTwoCopy, defaultSiteSettings.aboutSectionTwoCopy),
    aboutSectionThreeTitle: normalizeText(source.aboutSectionThreeTitle, defaultSiteSettings.aboutSectionThreeTitle),
    aboutSectionThreeCopy: normalizeText(source.aboutSectionThreeCopy, defaultSiteSettings.aboutSectionThreeCopy),
    aboutSectionFourTitle: normalizeText(source.aboutSectionFourTitle, defaultSiteSettings.aboutSectionFourTitle),
    aboutSectionFourCopy: normalizeText(source.aboutSectionFourCopy, defaultSiteSettings.aboutSectionFourCopy),
  }
}
