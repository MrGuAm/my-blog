import { NextRequest, NextResponse } from "next/server"
import { isAuthenticatedRequest } from "@/lib/server/auth"
import { finalizeUploadedBlobMusicTrack } from "@/lib/server/music"

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "提交的音乐信息无效" }, { status: 400 })
  }

  const pathname = typeof body.pathname === "string" ? body.pathname.trim() : ""
  const url = typeof body.url === "string" ? body.url.trim() : ""
  const contentType = typeof body.contentType === "string" ? body.contentType.trim() : ""
  const size = typeof body.size === "number" && Number.isFinite(body.size) ? Math.max(0, body.size) : 0
  const originalName = typeof body.originalName === "string" ? body.originalName.trim() : ""

  if (!pathname || !url) {
    return NextResponse.json({ error: "缺少上传完成后的音频信息" }, { status: 400 })
  }

  try {
    const track = await finalizeUploadedBlobMusicTrack({
      pathname,
      url,
      contentType,
      size,
      originalName,
    })
    return NextResponse.json({ track }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存曲库信息失败" },
      { status: 400 },
    )
  }
}
