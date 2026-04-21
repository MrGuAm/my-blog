export function buildEditorImageTag(url: string, alt = "图片") {
  return `\n<img src="${url}" alt="${alt}" style="max-width:100%;border-radius:8px;margin:16px 0;" />\n`
}

export async function normalizeEditorImageFile(file: File) {
  if (file.type !== "image/heic" && file.type !== "image/heif") {
    return file
  }

  const heic = (await import("heic2any")).default
  const convertedBlob = (await heic({ blob: file, toType: "image/jpeg", quality: 0.85 })) as Blob
  const nextName = file.name.replace(/\.(heic|heif)$/i, ".jpg")

  return new File([convertedBlob], nextName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  })
}

export async function readFileAsDataUrl(file: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(String(event.target?.result || ""))
    reader.onerror = () => reject(new Error("读取图片失败"))
    reader.readAsDataURL(file)
  })
}

export async function uploadEditorImageToMediaLibrary(file: File) {
  const normalizedFile = await normalizeEditorImageFile(file)
  const formData = new FormData()
  formData.append("file", normalizedFile)

  const response = await fetch("/api/admin/media", {
    method: "POST",
    body: formData,
  })

  const data = await response.json()
  if (!response.ok || !data.asset?.url) {
    throw new Error(data.error || "上传失败")
  }

  return {
    url: data.asset.url as string,
    fileName: normalizedFile.name,
  }
}
