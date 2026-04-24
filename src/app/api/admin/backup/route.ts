import { NextRequest, NextResponse } from "next/server"
import { buildSiteSnapshotFileName } from "@/lib/site-backup"
import { isAuthenticatedRequest } from "@/lib/server/auth"
import { buildSiteBackupSnapshot } from "@/lib/server/site-backup"

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 })
  }

  try {
    const snapshot = await buildSiteBackupSnapshot()
    const fileName = buildSiteSnapshotFileName(new Date(snapshot.manifest.exportedAt))

    return new NextResponse(JSON.stringify(snapshot, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json({ error: "导出站点快照失败，请稍后重试" }, { status: 500 })
  }
}
