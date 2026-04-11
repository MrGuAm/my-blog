"use client"

import { useState, useEffect } from "react"
import { Post } from "@/lib/posts"
import { useAuthStatus } from "@/hooks/useAuthStatus"

function parseMarkdown(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  // Escape HTML first, then apply safe markdown
  const escaped = escape(text)

  // Code blocks (```code```)
  const withCode = escaped.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre class="bg-secondary/80 text-xs rounded-lg p-3 my-2 overflow-x-auto"><code>${code.trim()}</code></pre>`
  })
  // Inline code (`code`)
  const withInlineCode = withCode.replace(/`([^`]+)`/g, '<code class="bg-secondary/80 px-1.5 py-0.5 rounded text-xs">$1</code>')
  // Bold (**text**)
  const withBold = withInlineCode.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // Italic (*text*)
  const withItalic = withBold.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  // Links [text](url)
  const withLinks = withItalic.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener">$1</a>')
  // Line breaks
  const withBreaks = withLinks.replace(/\n/g, '<br/>')

  return withBreaks
}

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
  const { isAuthenticated } = useAuthStatus()
  const [comments, setComments] = useState<Comment[]>([])
  const [author, setAuthor] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const loadComments = async () => {
      try {
        const res = await fetch(`/api/comments/${post.id}`)
        const data = await res.json()
        setComments(data.comments || [])
      } catch {}
    }

    loadComments()
  }, [post.id])

  const handleDelete = async (commentId: string) => {
    setDeletingCommentId(commentId)
    setSubmitMsg(null)

    try {
      const res = await fetch(`/api/comments/${post.id}?commentId=${encodeURIComponent(commentId)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok) {
        setComments((current) => current.filter((comment) => comment.id !== commentId))
        setSubmitMsg({ type: "success", text: "评论已删除" })
      } else {
        setSubmitMsg({ type: "error", text: data.error || "删除失败" })
      }
    } catch {
      setSubmitMsg({ type: "error", text: "网络错误，请重试" })
    } finally {
      setDeletingCommentId(null)
      setTimeout(() => setSubmitMsg(null), 3000)
    }
  }

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

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4 mb-8">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 bg-card rounded-xl border border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{comment.author}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{comment.date}</span>
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingCommentId === comment.id}
                    className="ml-auto text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {deletingCommentId === comment.id ? "删除中..." : "删除"}
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground"><span dangerouslySetInnerHTML={{ __html: parseMarkdown(comment.content) }} /></p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-8 mb-8">
          还没有评论，来抢沙发吧～
        </p>
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-card rounded-xl border border-border/40">
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
    </div>
  )
}
