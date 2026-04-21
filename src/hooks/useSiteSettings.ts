"use client"

import { useEffect, useState } from "react"
import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "@/lib/site-settings"

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      try {
        const response = await fetch("/api/site-settings", { cache: "no-store" })
        const data = await response.json()
        if (!response.ok || cancelled) return
        setSettings(normalizeSiteSettings(data.settings))
      } catch {
        if (!cancelled) {
          setSettings(defaultSiteSettings)
        }
      }
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [])

  return settings
}
