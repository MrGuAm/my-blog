import { PaletteHeroTrio } from "@/components/PaletteCharacters"
import SiteBrand from "@/components/SiteBrand"

function LoadingLine({ width }: { width: string }) {
  return <div className="h-4 rounded-full bg-secondary/70" style={{ width }} />
}

export default function Loading() {
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
            <p className="section-kicker">Loading</p>
            <div className="mt-4 space-y-4">
              <LoadingLine width="48%" />
              <LoadingLine width="88%" />
              <LoadingLine width="76%" />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-background/70 p-4">
                <LoadingLine width="42%" />
                <div className="mt-3 h-8 w-20 rounded-full bg-secondary/70" />
              </div>
              <div className="rounded-[1.5rem] bg-background/70 p-4">
                <LoadingLine width="42%" />
                <div className="mt-3 h-8 w-20 rounded-full bg-secondary/70" />
              </div>
              <div className="rounded-[1.5rem] bg-background/70 p-4">
                <LoadingLine width="42%" />
                <div className="mt-3 h-8 w-20 rounded-full bg-secondary/70" />
              </div>
            </div>
          </section>

          <section className="apple-panel-soft flex items-center justify-center rounded-[2.25rem] px-6 py-8">
            <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
              <PaletteHeroTrio />
              <div>
                <p className="section-kicker">Please Wait</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  页面正在准备中，稍等一下就会出现。
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
