import { NextRequest, NextResponse } from 'next/server'
import { validateMediaUploadInput, type MediaUploadFailure } from '@/lib/media-upload'
import { isAuthenticatedRequest } from '@/lib/server/auth'
import { canWriteMediaLibrary, deleteMediaFile, getMediaLibraryWarning, listMediaAssets, saveMediaFile } from '@/lib/server/media'

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录管理员账号' }, { status: 401 })
  }

  return NextResponse.json({
    assets: await listMediaAssets(),
    warning: getMediaLibraryWarning(),
    canUpload: canWriteMediaLibrary(),
  })
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录管理员账号' }, { status: 401 })
  }

  const formData = await request.formData()
  const files = formData.getAll('file').filter((value): value is File => value instanceof File)

  if (files.length === 0) {
    return NextResponse.json({ error: '请选择要上传的图片' }, { status: 400 })
  }

  try {
    const assets = []
    const failures: MediaUploadFailure[] = []

    for (const file of files) {
      const validationError = validateMediaUploadInput(file)
      if (validationError) {
        failures.push({ name: file.name || '未命名文件', reason: validationError })
        continue
      }

      try {
        const asset = await saveMediaFile(file)
        assets.push(asset)
      } catch (error) {
        failures.push({
          name: file.name || '未命名文件',
          reason: error instanceof Error ? error.message : '上传失败',
        })
      }
    }

    if (assets.length === 0) {
      return NextResponse.json(
        {
          error: failures[0]?.reason || '上传失败',
          failures,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        asset: assets[0] ?? null,
        assets,
        failures,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '上传失败' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录管理员账号' }, { status: 401 })
  }

  const url = new URL(request.url)
  const assetId = url.searchParams.get('id')
  const fileName = url.searchParams.get('name')
  const identifier = assetId || fileName

  if (!identifier) {
    return NextResponse.json({ error: '缺少素材标识' }, { status: 400 })
  }

  try {
    const deleted = await deleteMediaFile(identifier)
    if (!deleted) {
      return NextResponse.json({ error: '素材不存在' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '删除失败' }, { status: 400 })
  }
}
