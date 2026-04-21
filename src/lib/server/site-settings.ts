import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "@/lib/site-settings"
import { getSiteSettingsRecord, saveSiteSettingsRecord } from "./store-settings"

export async function getSiteSettings(): Promise<SiteSettings> {
  const record = await getSiteSettingsRecord()
  if (!record) return defaultSiteSettings

  try {
    return normalizeSiteSettings(JSON.parse(record.settings_json) as Partial<SiteSettings>)
  } catch {
    return defaultSiteSettings
  }
}

export async function updateSiteSettings(input: Partial<SiteSettings>) {
  const nextSettings = normalizeSiteSettings(input)
  await saveSiteSettingsRecord(JSON.stringify(nextSettings))
  return nextSettings
}
