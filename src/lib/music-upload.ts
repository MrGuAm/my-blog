const supportedMusicTypes = new Map([
  ["audio/mpeg", ".mp3"],
  ["audio/mp3", ".mp3"],
  ["audio/wav", ".wav"],
  ["audio/wave", ".wav"],
  ["audio/x-wav", ".wav"],
  ["audio/aac", ".aac"],
  ["audio/x-aac", ".aac"],
  ["audio/flac", ".flac"],
  ["audio/x-flac", ".flac"],
  ["audio/ogg", ".ogg"],
  ["audio/vorbis", ".ogg"],
  ["audio/mp4", ".m4a"],
  ["audio/x-m4a", ".m4a"],
  ["audio/m4a", ".m4a"],
])

const supportedExtensions = new Set([".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"])

export const MUSIC_UPLOAD_MAX_BYTES = 40 * 1024 * 1024
export const MUSIC_UPLOAD_HINT = "支持 MP3、WAV、M4A、AAC、FLAC、OGG，单首不超过 40MB。"

export function getMusicUploadExtension(fileName: string) {
  const extensionIndex = fileName.lastIndexOf(".")
  if (extensionIndex < 0) return ""
  const extension = fileName.slice(extensionIndex).toLowerCase()
  return supportedExtensions.has(extension) ? extension : ""
}

export function getMusicUploadExtensionByType(contentType: string) {
  return supportedMusicTypes.get(contentType.toLowerCase()) || ""
}

export function getMusicUploadAcceptValue() {
  return ".mp3,.wav,.m4a,.aac,.flac,.ogg,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/aac,audio/flac,audio/ogg"
}

export function getSupportedMusicContentTypes() {
  return [...supportedMusicTypes.keys()]
}

export function isSupportedMusicUpload(fileName: string, contentType: string) {
  return Boolean(getMusicUploadExtension(fileName) || getMusicUploadExtensionByType(contentType))
}

export function validateMusicUploadInput(file: Pick<File, "name" | "size" | "type">) {
  if (!file.name) {
    return { ok: false as const, error: "请选择要上传的音频文件" }
  }

  if (file.size <= 0) {
    return { ok: false as const, error: "音频内容为空，请重新选择" }
  }

  if (file.size > MUSIC_UPLOAD_MAX_BYTES) {
    return {
      ok: false as const,
      error: `单首音频不能超过 ${Math.round(MUSIC_UPLOAD_MAX_BYTES / 1024 / 1024)}MB`,
    }
  }

  if (!isSupportedMusicUpload(file.name, file.type || "")) {
    return {
      ok: false as const,
      error: "当前只支持上传 MP3、WAV、M4A、AAC、FLAC、OGG",
    }
  }

  return { ok: true as const }
}

export function sanitizeMusicBaseName(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export function buildManagedMusicPath(fileName: string) {
  const extension = getMusicUploadExtension(fileName) || ".mp3"
  const baseName = sanitizeMusicBaseName(fileName) || "track"
  const suffix =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `music-library/${baseName}-${suffix}${extension}`
}
