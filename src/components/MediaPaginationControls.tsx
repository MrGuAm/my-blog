"use client"

interface MediaPaginationControlsProps {
  currentPage: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
  className?: string
}

export default function MediaPaginationControls({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  className = "mt-4 flex flex-wrap items-center justify-center gap-2",
}: MediaPaginationControlsProps) {
  if (totalPages <= 1) return null

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        上一页
      </button>
      <span className="text-sm text-muted-foreground">
        第 {currentPage} / {totalPages} 页
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        下一页
      </button>
    </div>
  )
}
