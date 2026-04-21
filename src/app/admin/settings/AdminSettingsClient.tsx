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

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6 rounded-[2rem] border border-border/50 bg-card p-5 sm:p-6">
          <div>
            <p className="section-kicker">Brand</p>
            <h2 className="mt-2 text-xl font-bold">站点品牌</h2>
          </div>

          <FieldBlock label="站点名称" hint="会显示在顶部品牌区和页面文案里。">
            <input
              value={settings.brandName}
              onChange={(event) => updateField("brandName", event.target.value)}
              className={getInputClassName({})}
            />
          </FieldBlock>

          <FieldBlock label="页脚文案" hint="适合放版权信息或一句更个性化的收尾。">
            <input
              value={settings.footerText}
              onChange={(event) => updateField("footerText", event.target.value)}
              className={getInputClassName({})}
            />
          </FieldBlock>

          <div>
            <p className="section-kicker">Home</p>
            <h2 className="mt-2 text-xl font-bold">首页主视觉</h2>
          </div>

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

          <div>
            <p className="section-kicker">About</p>
            <h2 className="mt-2 text-xl font-bold">关于页文案</h2>
          </div>

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
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-border/50 bg-card p-5 sm:p-6">
            <p className="section-kicker">Preview</p>
            <h2 className="mt-2 text-xl font-bold">{settings.brandName}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{settings.footerText}</p>
          </section>

          <section className="rounded-[2rem] border border-border/50 bg-card p-5 sm:p-6">
            <p className="section-kicker">{settings.homeKicker}</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.06em]">{settings.homeTitle}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{settings.homeDescription}</p>
          </section>

          <section className="rounded-[2rem] border border-border/50 bg-card p-5 sm:p-6">
            <p className="section-kicker">{settings.aboutKicker}</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.06em]">{settings.aboutTitle}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{settings.aboutDescription}</p>
            <div className="mt-4 grid gap-3">
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
          </section>
        </aside>
      </div>
    </SectionPageShell>
  )
}
