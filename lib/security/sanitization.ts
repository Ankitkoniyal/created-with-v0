export function sanitizeHtml(input: string): string {
  // Remove HTML tags and decode HTML entities
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .trim()
}

export function sanitizeText(input: string): string {
  // Remove potentially dangerous characters and normalize whitespace
  return input
    .replace(/[<>"'&]/g, "") // Remove dangerous characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
}

export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

export function sanitizeFileName(fileName: string): string {
  // Remove dangerous characters from file names
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 255)
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

export const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
