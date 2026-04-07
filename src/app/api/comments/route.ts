import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const commentsFile = path.join(process.cwd(), 'data/comments.json')

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

// GET /api/comments - 获取所有评论（最新汇总）
export async function GET(request: NextRequest) {
  const data = readComments()
  // 收集所有评论
  const all: Comment[] = []
  for (const postId in data.comments) {
    all.push(...data.comments[postId])
  }
  // 按时间倒序，取最新10条
  const sorted = all
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
  return NextResponse.json({ comments: sorted })
}
