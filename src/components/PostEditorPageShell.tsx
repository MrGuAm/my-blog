"use client"

import type { ReactNode } from "react"
import PrimaryNavLinks from "@/components/PrimaryNavLinks"
import SiteBrand from "@/components/SiteBrand"
import { useSiteSettings } from "@/hooks/useSiteSettings"

interface PostEditorPageShellProps {
  pageTitle: string
  description: string
  savedAtText?: string | null
  onBack: () => void
  headerNotice?: ReactNode
  preForm?: ReactNode
  children: ReactNode
}

export default function PostEditorPageShell({
  pageTitle,
  description,
  savedAtText,
  onBack,
  headerNotice,
  preForm,
  children,
}: PostEditorPageShellProps) {
  const siteSettings = useSiteSettings()

  return (
    <div className="min-h-screen bg-background">
      <nav className="apple-nav sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SiteBrand label={siteSettings.brandName} />
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <button
                type="button"
                onClick={onBack}
                className="apple-button-secondary px-3 py-1.5"
              >
                ← 返回
              </button>
              <PrimaryNavLinks active="write" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">{description}</p>
          {savedAtText ? (
            <p className="mt-2 text-xs text-muted-foreground">{savedAtText}</p>
          ) : null}
          {headerNotice ? <div className="mt-3">{headerNotice}</div> : null}
        </div>

        {preForm ? <div className="mb-8">{preForm}</div> : null}

        {children}
      </div>
    </div>
  )
}
