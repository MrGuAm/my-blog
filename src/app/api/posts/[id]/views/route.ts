import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dataFile = path.join(process.cwd(), 'data/posts/posts.json')

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
    const idx = data.posts.findIndex((p: any) => p.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    data.posts[idx].views = (data.posts[idx].views || 0) + 1
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))

    return NextResponse.json({ views: data.posts[idx].views })
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
