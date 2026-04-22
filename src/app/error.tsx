"use client"

import { useEffect } from "react"
import Link from "next/link"
import { PaletteBadge, paletteTones } from "@/components/PaletteCharacters"
import SiteBrand from "@/components/SiteBrand"
import SiteFooter from "@/components/SiteFooter"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="apple-nav sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <SiteBrand />
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="editorial-card rounded-[2.25rem] p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <PaletteBadge tone={paletteTones[1].tone} mouthTone={paletteTones[1].mouthTone} mood={paletteTones[1].mood} />
              <div>
                <p className="section-kicker">Something Went Wrong</p>
                <h1 className="mt-1 text-[2rem] font-semibold tracking-[-0.06em] sm:text-[2.5rem]">
                  页面刚刚卡了一下。
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              一般刷新或重试就能恢复。如果问题持续存在，先回首页继续浏览会比较稳。
            </p>

            {error.digest ? (
              <p className="mt-4 text-xs text-muted-foreground">错误标识：{error.digest}</p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={reset} className="brand-solid-button">
                再试一次
              </button>
              <Link href="/home" className="apple-button-secondary">
                回到首页
              </Link>
              <Link href="/tags" className="apple-button-secondary">
                浏览标签
              </Link>
            </div>
          </section>

          <section className="apple-panel-soft flex items-center justify-center rounded-[2.25rem] px-6 py-8">
            <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
              <PaletteBadge tone={paletteTones[0].tone} mouthTone={paletteTones[0].mouthTone} mood={paletteTones[0].mood} />
              <div>
                <p className="section-kicker">Fallback</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  这是一个兜底错误页，至少不会让你掉进默认的空白页面里。
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
