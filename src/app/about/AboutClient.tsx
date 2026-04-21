"use client"

import { PaletteBadge, paletteTones } from "@/components/PaletteCharacters"
import PrimaryNavLinks from "@/components/PrimaryNavLinks"

export default function AboutClient() {
  return (
    <div className="min-h-screen text-foreground">
      {/* Navigation */}
      <nav className="apple-nav sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="brand-mark">
                <span className="text-white text-sm font-bold">C</span>
              </div>
              <span className="text-lg font-semibold tracking-[-0.03em]">Champion&apos;s Blog</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <PrimaryNavLinks active="about" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* About Content */}
        <div className="space-y-8">
          <section className="editorial-card sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="section-kicker">About Champion</span>
                <h1 className="mt-4 text-[2.1rem] font-semibold tracking-[-0.08em] sm:text-[2.6rem]">关于我。</h1>
                <p className="section-copy mt-3">
                  这里记录我正在做的事、喜欢的内容，以及这个博客为什么会长成现在这个样子。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <PaletteBadge tone={paletteTones[0].tone} mouthTone={paletteTones[0].mouthTone} mood={paletteTones[0].mood} />
                <PaletteBadge tone={paletteTones[2].tone} mouthTone={paletteTones[2].mouthTone} mood={paletteTones[2].mood} />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="editorial-card-soft rounded-[1.75rem]">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">关键词</p>
              <p className="mt-3 text-lg font-semibold">技术、音乐、生活</p>
            </div>
            <div className="editorial-card-soft rounded-[1.75rem]">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">写作感觉</p>
              <p className="mt-3 text-lg font-semibold">轻一点，真一点</p>
            </div>
            <div className="editorial-card-soft rounded-[1.75rem]">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">想留下的</p>
              <p className="mt-3 text-lg font-semibold">长期可回看的内容</p>
            </div>
          </section>

          <section className="editorial-card-soft">
            <div className="mb-3 flex items-center gap-3">
              <PaletteBadge tone={paletteTones[3].tone} mouthTone={paletteTones[3].mouthTone} mood={paletteTones[3].mood} />
              <h2 className="text-xl font-bold">🏠 这是什么博客?</h2>
            </div>
            <p className="text-muted-foreground">
              这是一个分享生活和技术的个人博客。记录我平时的想法、学习笔记和生活点滴。
              希望这些内容能对你有所帮助!
            </p>
          </section>

          <section className="editorial-card-soft">
            <div className="mb-3 flex items-center gap-3">
              <PaletteBadge tone={paletteTones[1].tone} mouthTone={paletteTones[1].mouthTone} mood={paletteTones[1].mood} />
              <h2 className="text-xl font-bold">👨‍💻 我是谁?</h2>
            </div>
            <p className="text-muted-foreground">
              我叫 Champion,一个热爱技术、喜欢音乐的开发者。平时喜欢折腾各种有趣的项目,
              也喜欢听歌、写代码、分享经验。
            </p>
          </section>

          <section className="editorial-card-soft">
            <div className="mb-3 flex items-center gap-3">
              <PaletteBadge tone={paletteTones[0].tone} mouthTone={paletteTones[0].mouthTone} mood={paletteTones[0].mood} />
              <h2 className="text-xl font-bold">🎯 我的目标</h2>
            </div>
            <p className="text-muted-foreground">
              持续学习,持续输出。用博客记录成长,让知识留下痕迹。
            </p>
          </section>

          <section className="editorial-card-soft">
            <div className="mb-3 flex items-center gap-3">
              <PaletteBadge tone={paletteTones[2].tone} mouthTone={paletteTones[2].mouthTone} mood={paletteTones[2].mood} />
              <h2 className="text-xl font-bold">📬 联系我</h2>
            </div>
            <p className="text-muted-foreground">
              如果你有任何问题或建议,欢迎通过博客留言或发送邮件交流!
            </p>
          </section>
        </div>
      </div>
      {/* Footer */}
      <footer className="border-t border-white/60 py-10 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Champion&apos;s Blog
        </div>
      </footer>
    </div>
  )
}
