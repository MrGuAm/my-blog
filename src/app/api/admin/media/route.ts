import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedRequest } from '@/lib/server/auth'
import { deleteMediaFile, getMediaLibraryWarning, listMediaAssets, saveMediaFile } from '@/lib/server/media'

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录管理员账号' }, { status: 401 })
  }

  return NextResponse.json({ assets: await listMediaAssets(), warning: getMediaLibraryWarning() })
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录管理员账号' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '请选择要上传的图片' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: '图片大小不能超过 5MB' }, { status: 400 })
  }

  try {
    const asset = await saveMediaFile(file)
    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '上传失败' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录管理员账号' }, { status: 401 })
  }

  const fileName = new URL(request.url).searchParams.get('name')
  if (!fileName) {
    return NextResponse.json({ error: '缺少素材名称' }, { status: 400 })
  }

  const deleted = await deleteMediaFile(fileName)
  if (!deleted) {
    return NextResponse.json({ error: '素材不存在' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
