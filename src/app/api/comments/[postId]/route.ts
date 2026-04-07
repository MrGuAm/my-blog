import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const commentsFile = path.join(process.cwd(), 'data/comments.json')

function ensureDataDir() {
  const dir = path.dirname(commentsFile)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

interface Comment {
  id: string
  postId: string
  author: string
  content: string
  date: string
}

interface CommentsData {
  comments: Record<string, Comment[]>
}

function readComments(): CommentsData {
  try {
    const data = fs.readFileSync(commentsFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { comments: {} }
  }
}

function writeComments(data: CommentsData): void {
  fs.writeFileSync(commentsFile, JSON.stringify(data, null, 2))
}

// GET /api/comments/[postId] - 获取某篇文章的所有评论
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const data = readComments()
  const postComments = data.comments[postId] || []
  // 按时间倒序
  const sorted = postComments.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return NextResponse.json({ comments: sorted })
}

// POST /api/comments/[postId] - 添加评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const body = await request.json()
  const { author, content } = body

  if (!author?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '昵称和评论内容不能为空' }, { status: 400 })
  }

  const data = readComments()
  ensureDataDir()
  if (!data.comments[postId]) {
    data.comments[postId] = []
  }
  writeComments(data)

  const newComment: Comment = {
    id: Date.now().toString(),
    postId,
    author: author.trim(),
    content: content.trim(),
    date: new Date().toISOString().split('T')[0]
  }

  data.comments[postId].push(newComment)
  writeComments(data)

  return NextResponse.json({ comment: newComment })
}
