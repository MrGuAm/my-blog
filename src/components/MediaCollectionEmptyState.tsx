"use client"

interface MediaCollectionEmptyStateProps {
  message: string
  className?: string
}

export default function MediaCollectionEmptyState({
  message,
  className = "rounded-2xl border border-border/50 bg-card p-8 text-center text-muted-foreground",
}: MediaCollectionEmptyStateProps) {
  return <div className={className}>{message}</div>
}
