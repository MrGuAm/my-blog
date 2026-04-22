"use client"

import { useRef, useState } from "react"
import { MEDIA_UPLOAD_ACCEPT } from "@/lib/media-upload"

export default function MediaUploadDropzone({
  canUpload,
  isUploading,
  hint,
  onSelectFiles,
  className = "",
  compact = false,
  multiple = true,
}: {
  canUpload: boolean
  isUploading: boolean
  hint: string
  onSelectFiles: (files: File[]) => void
  className?: string
  compact?: boolean
  multiple?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files?: FileList | null) => {
    onSelectFiles(Array.from(files ?? []))
  }

  return (
    <div
      role="button"
      tabIndex={canUpload ? 0 : -1}
      onClick={() => {
        if (!canUpload) return
        inputRef.current?.click()
      }}
      onKeyDown={(event) => {
        if (!canUpload) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(event) => {
        if (!canUpload) return
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragEnter={(event) => {
        if (!canUpload) return
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        setIsDragging(false)
      }}
      onDrop={(event) => {
        if (!canUpload) return
        event.preventDefault()
        setIsDragging(false)
        handleFiles(event.dataTransfer.files)
      }}
      className={[
        "rounded-2xl border border-dashed px-4 py-4 text-left transition-colors",
        canUpload ? "cursor-pointer" : "cursor-not-allowed opacity-60",
        isDragging ? "border-primary bg-primary/5" : "border-border/60 bg-background/60 hover:bg-accent/40",
        compact ? "min-h-0" : "min-h-28",
        className,
      ].join(" ")}
      aria-disabled={!canUpload}
    >
      <input
        ref={inputRef}
        type="file"
        accept={MEDIA_UPLOAD_ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ""
        }}
      />
      <div className="flex h-full flex-col justify-center gap-2">
        <p className="text-sm font-medium text-foreground">
          {!canUpload ? "请先配置 Blob 后再上传" : isUploading ? "图片上传中..." : "拖拽图片到这里，或点击选择文件"}
        </p>
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}
