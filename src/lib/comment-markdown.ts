function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function normalizeCommentLink(rawHref: string) {
  const trimmed = rawHref.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed, "https://example.com")
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:") {
      return trimmed
    }
  } catch {
    return null
  }

  return null
}

export function parseCommentMarkdown(text: string): string {
  const escaped = escapeHtml(text)

  const withCode = escaped.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre class="bg-secondary/80 text-xs rounded-lg p-3 my-2 overflow-x-auto"><code>${code.trim()}</code></pre>`
  })

  const withInlineCode = withCode.replace(/`([^`]+)`/g, '<code class="bg-secondary/80 px-1.5 py-0.5 rounded text-xs">$1</code>')
  const withBold = withInlineCode.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  const withItalic = withBold.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  const withLinks = withItalic.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeHref = normalizeCommentLink(href)
    if (!safeHref) {
      return label
    }
    return `<a href="${safeHref}" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">${label}</a>`
  })

  return withLinks.replace(/\n/g, "<br/>")
}

export { normalizeCommentLink }
