"use client"

import { useState } from "react"
import Link from "next/link"
import type { MediaUsageReference } from "@/lib/media-usage"
import { getMediaUsageHref } from "@/lib/media-usage"

function formatUsageKind(kind: "cover" | "content" | "cover+content") {
  if (kind === "cover") return "封面"
  if (kind === "content") return "正文"
  return "封面+正文"
}

export default function MediaUsageReferenceList({
  assetId,
  usagePosts,
  openInNewTab = false,
}: {
  assetId: string
  usagePosts?: MediaUsageReference[]
  openInNewTab?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  if (!usagePosts || usagePosts.length === 0) {
    return <p className="pt-1 text-[11px] text-muted-foreground">当前还没有文章引用这张图</p>
  }

  const visiblePosts = expanded ? usagePosts : usagePosts.slice(0, 2)

  return (
    <div className="pt-1">
      <div className="flex flex-wrap gap-2">
        {visiblePosts.map((usage) => (
          <Link
            key={`${assetId}-${usage.postId}-${usage.kind}`}
            href={getMediaUsageHref(usage)}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noreferrer" : undefined}
            className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {usage.draft ? "草稿" : "文章"} · {formatUsageKind(usage.kind)} · {usage.postTitle}
          </Link>
        ))}
        {!expanded && usagePosts.length > 2 ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            展开全部 {usagePosts.length} 篇
          </button>
        ) : null}
        {expanded && usagePosts.length > 2 ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            收起引用
          </button>
        ) : null}
      </div>
    </div>
  )
}
