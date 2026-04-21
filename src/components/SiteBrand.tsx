import { siteConfig } from "@/lib/site-config"

interface SiteBrandProps {
  label?: string
  className?: string
}

export default function SiteBrand({ label = siteConfig.name, className = "" }: SiteBrandProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="brand-mark">
        <span className="text-sm font-bold text-current">C</span>
      </div>
      <span className="text-lg font-semibold tracking-[-0.03em]">{label}</span>
    </div>
  )
}
