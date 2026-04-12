"use client"

interface MarqueeTextProps {
  text: string
  isActive: boolean
  charCount?: number
}

export default function MarqueeText({ text, isActive, charCount = 6 }: MarqueeTextProps) {
  return (
    <span className="block max-w-full overflow-hidden leading-tight">
      {text.length <= charCount || !isActive ? (
        <span className="block truncate">{text}</span>
      ) : (
        <span className="inline-block animate-marquee whitespace-nowrap">{text}</span>
      )}
    </span>
  )
}
