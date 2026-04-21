import { ensureStoreReady, getDb, getSql, isRemoteDatabaseEnabled } from "./store-core"

interface SiteSettingsRow {
  settings_json: string
  updated_at: string
}

export async function getSiteSettingsRecord() {
  await ensureStoreReady()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    const rows = (await sql`
      SELECT settings_json, updated_at
      FROM site_settings
      WHERE id = 1
      LIMIT 1
    `) as SiteSettingsRow[]
    return rows[0] || null
  }

  const row = getDb()
    .prepare(
      `
        SELECT settings_json, updated_at
        FROM site_settings
        WHERE id = 1
        LIMIT 1
      `
    )
    .get() as SiteSettingsRow | undefined

  return row || null
}

export async function saveSiteSettingsRecord(settingsJson: string) {
  await ensureStoreReady()
  const updatedAt = new Date().toISOString()

  if (isRemoteDatabaseEnabled()) {
    const sql = getSql()
    await sql`
      INSERT INTO site_settings (id, settings_json, updated_at)
      VALUES (1, ${settingsJson}, ${updatedAt})
      ON CONFLICT (id)
      DO UPDATE SET settings_json = ${settingsJson}, updated_at = ${updatedAt}
    `
    return { settings_json: settingsJson, updated_at: updatedAt }
  }

  getDb()
    .prepare(
      `
        INSERT INTO site_settings (id, settings_json, updated_at)
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at
      `
    )
    .run(settingsJson, updatedAt)

  return { settings_json: settingsJson, updated_at: updatedAt }
}
