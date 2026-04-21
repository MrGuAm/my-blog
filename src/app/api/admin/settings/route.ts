import { NextRequest, NextResponse } from "next/server"
import { isAuthenticatedRequest } from "@/lib/server/auth"
import { getSiteSettings, updateSiteSettings } from "@/lib/server/site-settings"
import type { SiteSettings } from "@/lib/site-settings"

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 })
  }

  return NextResponse.json({ settings: await getSiteSettings() })
}

export async function PATCH(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as Partial<SiteSettings> | null
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "提交的设置内容无效" }, { status: 400 })
  }

  const settings = await updateSiteSettings(payload)
  return NextResponse.json({ settings })
}
