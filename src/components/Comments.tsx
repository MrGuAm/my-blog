"use client"

import { useState, useEffect } from "react"
import { Post } from "@/lib/posts"

interface Comment {
  id: string
  postId: string
  author: string
  content: string
  date: string
}

interface CommentsProps {
  post: Post
}

export default function Comments({ post }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [author, setAuthor] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetch(`/api/comments/${post.id}`)
      .then(r => r.json())
      .then(data => setComments(data.comments || []))
      .catch(() => {})
  }, [post.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !content.trim()) return

    setIsSubmitting(true)
    setSubmitMsg(null)

    try {
      const res = await fetch(`/api/comments/${post.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, content }),
      })
      const data = await res.json()

      if (res.ok) {
        setComments([data.comment, ...comments])
        setAuthor("")
        setContent("")
        setSubmitMsg({ type: "success", text: "评论发布成功！" })
      } else {
        setSubmitMsg({ type: "error", text: data.error || "评论失败" })
      }
    } catch {
      setSubmitMsg({ type: "error", text: "网络错误，请重试" })
    }

    setIsSubmitting(false)
    setTimeout(() => setSubmitMsg(null), 3000)
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        💬 评论 <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
      </h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-card rounded-xl border border-border/40">
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">昵称</label>
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="写下你的昵称..."
            maxLength={20}
            className="w-full px-3 py-2 bg-secondary/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">评论</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="说点什么..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 bg-secondary/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm resize-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !author.trim() || !content.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "发布中..." : "发布评论"}
          </button>
          {submitMsg && (
            <span className={`text-sm ${submitMsg.type === "success" ? "text-green-500" : "text-red-500"}`}>
              {submitMsg.text}
            </span>
          )}
        </div>
      </form>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 bg-card rounded-xl border border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{comment.author}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{comment.date}</span>
              </div>
              <p className="text-sm text-muted-foreground">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-8">
          还没有评论，来抢沙发吧～
        </p>
      )}
    </div>
  )
}
