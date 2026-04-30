"use client"

interface MediaSelectionToolbarProps {
  selectedCount: number
  deletableSelectedCount: number
  filteredCount: number
  currentPage: number
  totalPages: number
  visibleCount: number
  visibleUnusedCount: number
  visibleUsedCount: number
  allSelectableVisibleSelected: boolean
  onToggleSelectAllVisible: () => void
  onInvertVisibleSelection: () => void
  onSelectVisibleUnused: () => void
  onSelectVisibleUsed: () => void
  onClearSelection: () => void
}

export default function MediaSelectionToolbar({
  selectedCount,
  deletableSelectedCount,
  filteredCount,
  currentPage,
  totalPages,
  visibleCount,
  visibleUnusedCount,
  visibleUsedCount,
  allSelectableVisibleSelected,
  onToggleSelectAllVisible,
  onInvertVisibleSelection,
  onSelectVisibleUnused,
  onSelectVisibleUsed,
  onClearSelection,
}: MediaSelectionToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm xl:flex-row xl:items-center xl:justify-between">
      <p className="text-muted-foreground">
        {selectedCount > 0
          ? `已选中 ${selectedCount} 张素材${deletableSelectedCount < selectedCount ? `，其中 ${deletableSelectedCount} 张可删除` : ""}`
          : `筛选结果共 ${filteredCount} 张素材，当前第 ${currentPage} / ${totalPages} 页`}
      </p>
      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
        <button
          type="button"
          onClick={onToggleSelectAllVisible}
          disabled={visibleCount === 0}
          className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {allSelectableVisibleSelected ? "取消全选可见项" : "全选可见项"}
        </button>
        <button
          type="button"
          onClick={onInvertVisibleSelection}
          disabled={visibleCount === 0}
          className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          反选可见项
        </button>
        <button
          type="button"
          onClick={onSelectVisibleUnused}
          disabled={visibleUnusedCount === 0}
          className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          选中未使用可见项
        </button>
        <button
          type="button"
          onClick={onSelectVisibleUsed}
          disabled={visibleUsedCount === 0}
          className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          选中使用中可见项
        </button>
        {selectedCount > 0 ? (
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
          >
            清空选择
          </button>
        ) : null}
      </div>
    </div>
  )
}
