import { siteConfig } from "@/lib/site-config"

interface SiteFooterProps {
  className?: string
  innerClassName?: string
}

export default function SiteFooter({
  className = "border-t border-white/60 py-10 dark:border-white/10",
  innerClassName = "mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground sm:px-6",
}: SiteFooterProps) {
  return (
    <footer className={className}>
      <div className={innerClassName}>© 2026 {siteConfig.name}</div>
    </footer>
  )
}
