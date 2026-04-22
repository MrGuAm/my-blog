export interface MediaUploadCandidate {
  size: number
  type: string
}

export interface MediaUploadFailure {
  name: string
  reason: string
}

export interface ClipboardMediaItemLike {
  kind: string
  type: string
  getAsFile: () => File | null
}

export interface MediaExportAssetLike {
  name: string
  url: string
}

export const MEDIA_UPLOAD_MAX_BYTES = 4.5 * 1024 * 1024
export const MEDIA_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const
export const MEDIA_UPLOAD_MIME_TYPE_SET = new Set<string>(MEDIA_UPLOAD_MIME_TYPES)
export const MEDIA_UPLOAD_ACCEPT = MEDIA_UPLOAD_MIME_TYPES.join(",")
export const MEDIA_UPLOAD_FORMATS_LABEL = "JPG、PNG、WebP、GIF、SVG"

function formatUploadLimit(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function getMediaUploadHint() {
  return `支持 ${MEDIA_UPLOAD_FORMATS_LABEL}，单张图片最大 ${formatUploadLimit(MEDIA_UPLOAD_MAX_BYTES)}；JPG、PNG、WebP 会自动压缩为 WebP。`
}

export function validateMediaUploadInput(file: MediaUploadCandidate) {
  if (!file.size) {
    return "图片内容为空，请重新选择"
  }

  if (!MEDIA_UPLOAD_MIME_TYPE_SET.has(file.type)) {
    return `当前只支持上传 ${MEDIA_UPLOAD_FORMATS_LABEL} 图片`
  }

  if (file.size > MEDIA_UPLOAD_MAX_BYTES) {
    return `当前上传方式下图片大小不能超过 ${formatUploadLimit(MEDIA_UPLOAD_MAX_BYTES)}`
  }

  return null
}

export function formatMediaUploadBatchMessage({
  successCount,
  failures,
  autoSelected = false,
}: {
  successCount: number
  failures: MediaUploadFailure[]
  autoSelected?: boolean
}) {
  if (successCount > 0 && failures.length === 0) {
    if (autoSelected && successCount === 1) {
      return "图片已上传并自动选用"
    }
    return successCount === 1 ? "素材上传成功" : `已上传 ${successCount} 张素材`
  }

  const failureSummary = failures
    .slice(0, 2)
    .map((failure) => `${failure.name}（${failure.reason}）`)
    .join("；")
  const failureSuffix = failures.length > 2 ? "；其余文件也上传失败" : ""

  if (successCount > 0) {
    return `已上传 ${successCount} 张，${failures.length} 张失败：${failureSummary}${failureSuffix}`
  }

  return `上传失败：${failureSummary}${failureSuffix}`
}

export function extractClipboardMediaFiles(items: Iterable<ClipboardMediaItemLike>) {
  const files: File[] = []
  for (const item of items) {
    if (item.kind !== "file") continue
    if (!MEDIA_UPLOAD_MIME_TYPE_SET.has(item.type)) continue
    const file = item.getAsFile()
    if (file) {
      files.push(file)
    }
  }
  return files
}

export function buildMediaAssetBatchText(
  assets: MediaExportAssetLike[],
  format: "url" | "markdown" | "html"
) {
  if (format === "url") {
    return assets.map((asset) => asset.url).join("\n")
  }

  if (format === "markdown") {
    return assets.map((asset) => `![${asset.name}](${asset.url})`).join("\n")
  }

  return assets.map((asset) => `<img src="${asset.url}" alt="${asset.name}" />`).join("\n")
}
