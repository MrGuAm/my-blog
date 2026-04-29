import { NextRequest, NextResponse } from "next/server"
import { isAuthenticatedRequest } from "@/lib/server/auth"
import { getMusicLibraryWarning, listMusicLibraryTracks, uploadManagedMusicTrack, deleteManagedMusicTrack, canUseDirectBlobMusicUpload, canWriteMusicLibrary } from "@/lib/server/music"

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 })
  }

  return NextResponse.json({
    tracks: await listMusicLibraryTracks(),
    warning: getMusicLibraryWarning(),
    canUpload: canWriteMusicLibrary(),
    directBlobUploadEnabled: canUseDirectBlobMusicUpload(),
  })
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 })
  }

  const formData = await request.formData()
  const files = formData
    .getAll("file")
    .filter((item): item is File => item instanceof File)

  if (files.length === 0) {
    return NextResponse.json({ error: "请选择要上传的音频文件" }, { status: 400 })
  }

  const tracks = []
  const failures: Array<{ name: string; error: string }> = []

  for (const file of files) {
    try {
      tracks.push(await uploadManagedMusicTrack(file))
    } catch (error) {
      failures.push({
        name: file.name || "未命名音频",
        error: error instanceof Error ? error.message : "上传失败",
      })
    }
  }

  if (tracks.length === 0) {
    return NextResponse.json(
      {
        error: failures[0]?.error || "上传失败",
        failures,
      },
      { status: 400 },
    )
  }

  return NextResponse.json({ tracks, failures }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 })
  }

  const url = new URL(request.url)
  const queryIds = url.searchParams.getAll("id").filter(Boolean)
  let bodyIds: string[] = []

  if (!queryIds.length) {
    try {
      const body = await request.json()
      bodyIds = Array.isArray(body?.ids)
        ? body.ids.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
        : []
    } catch {
      bodyIds = []
    }
  }

  const ids = queryIds.length ? queryIds : bodyIds
  if (ids.length === 0) {
    return NextResponse.json({ error: "缺少歌曲标识" }, { status: 400 })
  }

  const deletedIds: string[] = []
  const missingIds: string[] = []

  for (const id of ids) {
    const deleted = await deleteManagedMusicTrack(id)
    if (deleted) {
      deletedIds.push(id)
    } else {
      missingIds.push(id)
    }
  }

  return NextResponse.json({ success: deletedIds.length > 0, deletedIds, missingIds })
}
