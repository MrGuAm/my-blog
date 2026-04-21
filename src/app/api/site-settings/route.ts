import { NextResponse } from "next/server"
import { getSiteSettings } from "@/lib/server/site-settings"

export async function GET() {
  return NextResponse.json({ settings: await getSiteSettings() })
}
