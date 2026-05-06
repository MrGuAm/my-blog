"use client"

import { useState, type ReactNode } from "react"
import SectionPageShell from "@/components/SectionPageShell"
import type { SiteSettings } from "@/lib/site-settings"

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </label>
  )
}

function getInputClassName({ multiline = false }: { multiline?: boolean }) {
  return multiline
    ? "min-h-28 w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
    : "w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
}

function SettingsModuleCard({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[2rem] border border-border/50 bg-card p-5 sm:p-6">
      <p className="section-kicker">{kicker}</p>
      <h2 className="mt-2 text-xl font-bold">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

function SettingsModulePair({
  form,
  preview,
}: {
  form: ReactNode
  preview: ReactNode
}) {
  return <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">{form}{preview}</section>
}

export default function AdminSettingsClient({ initialSettings }: { initialSettings: SiteSettings }) {
  const [settings, setSettings] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  const updateField = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(data.error || "保存失败")
        return
      }
      setSettings(data.settings)
      setMessage("站点设置已保存")
    } catch {
      setMessage("网络错误，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  const aboutDetailFields: Array<{
    titleKey: keyof SiteSettings
    copyKey: keyof SiteSettings
    label: string
  }> = [
    { titleKey: "aboutSectionOneTitle", copyKey: "aboutSectionOneCopy", label: "About 模块 1" },
    { titleKey: "aboutSectionTwoTitle", copyKey: "aboutSectionTwoCopy", label: "About 模块 2" },
    { titleKey: "aboutSectionThreeTitle", copyKey: "aboutSectionThreeCopy", label: "About 模块 3" },
    { titleKey: "aboutSectionFourTitle", copyKey: "aboutSectionFourCopy", label: "About 模块 4" },
  ]

  return (
    <SectionPageShell
      navLabel="站点设置"
      activeNav="settings"
      brandLabel={settings.brandName}
      title="品牌与前台文案"
      description="把最常改、最容易分散的前台文案集中在后台里统一维护。"
      backLinkHref="/admin"
      backLinkLabel="← 返回后台总览"
      headerActions={
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="brand-solid-button min-w-28 justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "保存中..." : "保存设置"}
        </button>
      }
    >
      {message ? <p className="mb-4 text-sm text-primary">{message}</p> : null}

      <div className="space-y-6">
        <SettingsModulePair
          form={
            <SettingsModuleCard kicker="Brand" title="站点品牌">
              <FieldBlock label="站点名称" hint="会显示在顶部品牌区和页面文案里。">
                <input
                  value={settings.brandName}
                  onChange={(event) => updateField("brandName", event.target.value)}
                  className={getInputClassName({})}
                />
              </FieldBlock>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="作者名称" hint="会用于 metadata 作者信息和文章作者标识。">
                  <input
                    value={settings.authorName}
                    onChange={(event) => updateField("authorName", event.target.value)}
                    className={getInputClassName({})}
                  />
                </FieldBlock>
                <FieldBlock label="Twitter 标识" hint="例如 @champion，用于分享卡片。">
                  <input
                    value={settings.twitterHandle}
                    onChange={(event) => updateField("twitterHandle", event.target.value)}
                    className={getInputClassName({})}
                  />
                </FieldBlock>
              </div>
            </SettingsModuleCard>
          }
          preview={
            <SettingsModuleCard kicker="Brand Preview" title={settings.brandName}>
              <p className="text-sm text-muted-foreground">作者：{settings.authorName}</p>
              <p className="text-sm text-muted-foreground">Twitter：{settings.twitterHandle}</p>
            </SettingsModuleCard>
          }
        />

        <SettingsModulePair
          form={
            <SettingsModuleCard kicker="Links" title="联系与外链">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="联系邮箱" hint="会在 About 页渲染成可点击邮箱。">
                  <input
                    value={settings.contactEmail}
                    onChange={(event) => updateField("contactEmail", event.target.value)}
                    className={getInputClassName({})}
                  />
                </FieldBlock>
                <FieldBlock label="GitHub 地址">
                  <input
                    value={settings.githubUrl}
                    onChange={(event) => updateField("githubUrl", event.target.value)}
                    className={getInputClassName({})}
                  />
                </FieldBlock>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="X / Twitter 主页地址">
                  <input
                    value={settings.xProfileUrl}
                    onChange={(event) => updateField("xProfileUrl", event.target.value)}
                    className={getInputClassName({})}
                  />
                </FieldBlock>
                <FieldBlock label="主链接标题" hint="比如：作品集 / GitHub / 现在在做的项目。">
                  <input
                    value={settings.primaryLinkLabel}
                    onChange={(event) => updateField("primaryLinkLabel", event.target.value)}
                    className={getInputClassName({})}
                  />
                </FieldBlock>
              </div>

              <FieldBlock label="主链接地址">
                <input
                  value={settings.primaryLinkUrl}
                  onChange={(event) => updateField("primaryLinkUrl", event.target.value)}
                  className={getInputClassName({})}
                />
              </FieldBlock>
            </SettingsModuleCard>
          }
          preview={
            <SettingsModuleCard kicker="Links Preview" title="联系与外链">
              <div className="flex flex-wrap gap-2">
                {settings.contactEmail ? <span className="rounded-full bg-background/70 px-3 py-1 text-xs">邮箱</span> : null}
                {settings.githubUrl ? <span className="rounded-full bg-background/70 px-3 py-1 text-xs">GitHub</span> : null}
                {settings.xProfileUrl ? <span className="rounded-full bg-background/70 px-3 py-1 text-xs">X</span> : null}
                {settings.primaryLinkUrl ? (
                  <span className="rounded-full bg-background/70 px-3 py-1 text-xs">{settings.primaryLinkLabel}</span>
                ) : null}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {settings.contactEmail ? <p>联系邮箱：{settings.contactEmail}</p> : null}
                {settings.githubUrl ? <p>GitHub：{settings.githubUrl}</p> : null}
                {settings.xProfileUrl ? <p>X / Twitter：{settings.xProfileUrl}</p> : null}
                {settings.primaryLinkUrl ? <p>{settings.primaryLinkLabel}：{settings.primaryLinkUrl}</p> : null}
              </div>
            </SettingsModuleCard>
          }
        />

        <SettingsModulePair
          form={
            <SettingsModuleCard kicker="SEO" title="页脚与站点 SEO">
              <FieldBlock label="页脚文案" hint="适合放版权信息或一句更个性化的收尾。">
                <input
                  value={settings.footerText}
                  onChange={(event) => updateField("footerText", event.target.value)}
                  className={getInputClassName({})}
                />
              </FieldBlock>

              <FieldBlock label="站点 SEO 描述" hint="会用于首页、默认分享卡片和 RSS 描述。">
                <textarea
                  value={settings.siteDescription}
                  onChange={(event) => updateField("siteDescription", event.target.value)}
                  className={getInputClassName({ multiline: true })}
                />
              </FieldBlock>

              <FieldBlock label="SEO 关键词" hint="用逗号或换行分隔，会用于 metadata keywords。">
                <textarea
                  value={settings.seoKeywords}
                  onChange={(event) => updateField("seoKeywords", event.target.value)}
                  className={getInputClassName({ multiline: true })}
                />
              </FieldBlock>
            </SettingsModuleCard>
          }
          preview={
            <SettingsModuleCard kicker="SEO Preview" title="页脚与站点 SEO">
              <p className="text-sm text-muted-foreground">{settings.footerText}</p>
              <p className="text-xs leading-5 text-muted-foreground">SEO：{settings.siteDescription}</p>
              <p className="text-xs leading-5 text-muted-foreground">关键词：{settings.seoKeywords}</p>
            </SettingsModuleCard>
          }
        />

        <SettingsModulePair
          form={
            <SettingsModuleCard kicker="Home" title="首页主视觉">
              <FieldBlock label="首页角标">
                <input
                  value={settings.homeKicker}
                  onChange={(event) => updateField("homeKicker", event.target.value)}
                  className={getInputClassName({})}
                />
              </FieldBlock>

              <FieldBlock label="首页主标题" hint="建议控制在 18 到 28 个字，首屏会更舒服。">
                <textarea
                  value={settings.homeTitle}
                  onChange={(event) => updateField("homeTitle", event.target.value)}
                  className={getInputClassName({ multiline: true })}
                />
              </FieldBlock>

              <FieldBlock label="首页说明">
                <textarea
                  value={settings.homeDescription}
                  onChange={(event) => updateField("homeDescription", event.target.value)}
                  className={getInputClassName({ multiline: true })}
                />
              </FieldBlock>
            </SettingsModuleCard>
          }
          preview={
            <SettingsModuleCard kicker="Home Preview" title={settings.homeTitle}>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{settings.homeKicker}</p>
              <p className="text-sm leading-6 text-muted-foreground">{settings.homeDescription}</p>
            </SettingsModuleCard>
          }
        />

        <SettingsModulePair
          form={
            <SettingsModuleCard kicker="About" title="关于页文案">
              <FieldBlock label="关于页角标">
                <input
                  value={settings.aboutKicker}
                  onChange={(event) => updateField("aboutKicker", event.target.value)}
                  className={getInputClassName({})}
                />
              </FieldBlock>

              <FieldBlock label="关于页标题">
                <input
                  value={settings.aboutTitle}
                  onChange={(event) => updateField("aboutTitle", event.target.value)}
                  className={getInputClassName({})}
                />
              </FieldBlock>

              <FieldBlock label="关于页简介">
                <textarea
                  value={settings.aboutDescription}
                  onChange={(event) => updateField("aboutDescription", event.target.value)}
                  className={getInputClassName({ multiline: true })}
                />
              </FieldBlock>

              <FieldBlock label="关于页 SEO 描述">
                <textarea
                  value={settings.aboutMetaDescription}
                  onChange={(event) => updateField("aboutMetaDescription", event.target.value)}
                  className={getInputClassName({ multiline: true })}
                />
              </FieldBlock>
            </SettingsModuleCard>
          }
          preview={
            <SettingsModuleCard kicker="About Preview" title={settings.aboutTitle}>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{settings.aboutKicker}</p>
              <p className="text-sm leading-6 text-muted-foreground">{settings.aboutDescription}</p>
              <p className="text-xs leading-5 text-muted-foreground">About SEO：{settings.aboutMetaDescription}</p>
            </SettingsModuleCard>
          }
        />

        <SettingsModulePair
          form={
            <SettingsModuleCard kicker="About Highlights" title="关于页高亮信息">
              <div className="grid gap-4 md:grid-cols-3">
                <FieldBlock label="高频关键词">
                  <input
                    value={settings.aboutHighlightKeywords}
                    onChange={(event) => updateField("aboutHighlightKeywords", event.target.value)}
                    className={getInputClassName({})}
                  />
                </FieldBlock>
                <FieldBlock label="写作感觉">
                  <input
                    value={settings.aboutHighlightStyle}
                    onChange={(event) => updateField("aboutHighlightStyle", event.target.value)}
                    className={getInputClassName({})}
                  />
                </FieldBlock>
                <FieldBlock label="想留下的">
                  <input
                    value={settings.aboutHighlightGoal}
                    onChange={(event) => updateField("aboutHighlightGoal", event.target.value)}
                    className={getInputClassName({})}
                  />
                </FieldBlock>
              </div>
            </SettingsModuleCard>
          }
          preview={
            <SettingsModuleCard kicker="About Highlights Preview" title="关于页高亮信息">
              <div className="grid gap-3">
                {[
                  ["关键词", settings.aboutHighlightKeywords],
                  ["写作感觉", settings.aboutHighlightStyle],
                  ["想留下的", settings.aboutHighlightGoal],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-background/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                    <p className="mt-2 text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </SettingsModuleCard>
          }
        />

        <SettingsModulePair
          form={
            <SettingsModuleCard kicker="About Modules" title="About 模块文案">
              <div className="grid gap-4">
                {aboutDetailFields.map(({ titleKey, copyKey, label }) => (
                  <div key={String(titleKey)} className="rounded-[1.5rem] border border-border/50 bg-background/40 p-4">
                    <p className="mb-4 text-sm font-semibold">{label}</p>
                    <div className="grid gap-4">
                      <FieldBlock label="模块标题">
                        <input
                          value={settings[titleKey] as string}
                          onChange={(event) => updateField(titleKey, event.target.value as SiteSettings[typeof titleKey])}
                          className={getInputClassName({})}
                        />
                      </FieldBlock>
                      <FieldBlock label="模块正文">
                        <textarea
                          value={settings[copyKey] as string}
                          onChange={(event) => updateField(copyKey, event.target.value as SiteSettings[typeof copyKey])}
                          className={getInputClassName({ multiline: true })}
                        />
                      </FieldBlock>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsModuleCard>
          }
          preview={
            <SettingsModuleCard kicker="About Modules Preview" title="About 模块预览">
              <div className="space-y-3">
                {[
                  [settings.aboutSectionOneTitle, settings.aboutSectionOneCopy],
                  [settings.aboutSectionTwoTitle, settings.aboutSectionTwoCopy],
                  [settings.aboutSectionThreeTitle, settings.aboutSectionThreeCopy],
                  [settings.aboutSectionFourTitle, settings.aboutSectionFourCopy],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-2xl bg-background/70 px-4 py-3">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
                  </div>
                ))}
              </div>
            </SettingsModuleCard>
          }
        />

        <SettingsModulePair
          form={
            <SettingsModuleCard kicker="Music SEO" title="音乐页 SEO">
              <FieldBlock label="音乐页 SEO 描述">
                <textarea
                  value={settings.musicMetaDescription}
                  onChange={(event) => updateField("musicMetaDescription", event.target.value)}
                  className={getInputClassName({ multiline: true })}
                />
              </FieldBlock>
            </SettingsModuleCard>
          }
          preview={
            <SettingsModuleCard kicker="Music SEO Preview" title="音乐页描述">
              <p className="text-sm leading-6 text-muted-foreground">{settings.musicMetaDescription}</p>
            </SettingsModuleCard>
          }
        />
      </div>
    </SectionPageShell>
  )
}
