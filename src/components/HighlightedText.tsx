"use client"

import { splitHighlightedText } from "@/lib/post-search"

interface HighlightedTextProps {
  text: string
  query: string
  highlightClassName?: string
}

export default function HighlightedText({
  text,
  query,
  highlightClassName = "rounded bg-[#ffe1b3]/80 px-1 text-foreground",
}: HighlightedTextProps) {
  return splitHighlightedText(text, query).map((part, index) =>
    part.match ? (
      <mark key={`${text}-${index}`} className={highlightClassName}>
        {part.text}
      </mark>
    ) : (
      <span key={`${text}-${index}`}>{part.text}</span>
    )
  )
}
