import type { ReactNode } from "react"
import Link from "next/link"
import PrimaryNavLinks, { type NavKey } from "@/components/PrimaryNavLinks"
import SiteBrand from "@/components/SiteBrand"

interface SectionPageShellProps {
  navLabel: string
  activeNav?: NavKey
  title?: string
  description?: string
  navActions?: ReactNode
  headerTop?: ReactNode
  headerActions?: ReactNode
  backLinkHref?: string
  backLinkLabel?: string
  children: ReactNode
}

export default function SectionPageShell({
  navLabel,
  activeNav,
  title,
  description,
  navActions,
  headerTop,
  headerActions,
  backLinkHref,
  backLinkLabel = "← 返回首页",
  children,
}: SectionPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="apple-nav sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SiteBrand label={navLabel} />
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <PrimaryNavLinks active={activeNav} />
              {navActions}
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {backLinkHref ? (
          <Link href={backLinkHref} className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
            {backLinkLabel}
          </Link>
        ) : null}

        {title || description || headerTop || headerActions ? (
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              {headerTop}
              {title ? <h1 className="text-3xl font-black tracking-tight">{title}</h1> : null}
              {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
            </div>
            {headerActions ? <div className="flex flex-col gap-3 md:items-end">{headerActions}</div> : null}
          </header>
        ) : null}

        {children}
      </div>
    </div>
  )
}
