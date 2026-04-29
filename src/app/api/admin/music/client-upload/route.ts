import { handleUpload } from "@vercel/blob/client"
import { NextRequest, NextResponse } from "next/server"
import { getSupportedMusicContentTypes, MUSIC_UPLOAD_MAX_BYTES } from "@/lib/music-upload"
import { isAuthenticatedRequest } from "@/lib/server/auth"
import { canUseDirectBlobMusicUpload } from "@/lib/server/music"

export async function POST(request: NextRequest) {
  if (!canUseDirectBlobMusicUpload()) {
    return NextResponse.json({ error: "当前环境未启用直传曲库上传" }, { status: 400 })
  }

  const body = await request.json()
  if (body?.type === "blob.generate-client-token" && !isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 })
  }

  try {
    const json = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("music-library/")) {
          throw new Error("无效的音乐上传路径")
        }

        return {
          allowedContentTypes: getSupportedMusicContentTypes(),
          maximumSizeInBytes: MUSIC_UPLOAD_MAX_BYTES,
          addRandomSuffix: false,
        }
      },
    })

    return NextResponse.json(json)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成上传凭证失败" },
      { status: 400 },
    )
  }
}
