// Image validation utilities for uploads

export interface ImageValidationResult {
  valid: boolean
  error?: string
}

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

// Maximum dimensions (optional, for client-side validation)
const MAX_WIDTH = 4000
const MAX_HEIGHT = 4000

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file exists
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Check file type by MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    }
  }

  // Check file extension as additional validation
  const fileName = file.name.toLowerCase()
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext))

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Validate multiple image files
 */
export function validateImageFiles(files: File[]): ImageValidationResult & { invalidFiles?: string[] } {
  if (files.length === 0) {
    return { valid: false, error: 'No files provided' }
  }

  // Maximum 8 images per product
  if (files.length > 8) {
    return {
      valid: false,
      error: 'Maximum 8 images allowed per product',
    }
  }

  const invalidFiles: string[] = []

  for (const file of files) {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      invalidFiles.push(`${file.name}: ${validation.error}`)
    }
  }

  if (invalidFiles.length > 0) {
    return {
      valid: false,
      error: `Invalid files:\n${invalidFiles.join('\n')}`,
      invalidFiles,
    }
  }

  return { valid: true }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const name = filename.split('/').pop() || filename
  // Remove special characters, keep only alphanumeric, dots, dashes, underscores
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * Create safe filename with timestamp
 */
export function createSafeFilename(originalName: string, userId: string, index?: number): string {
  const sanitized = sanitizeFilename(originalName)
  const ext = getFileExtension(sanitized)
  const baseName = sanitized.replace(/\.[^/.]+$/, '') || 'image'
  const timestamp = Date.now()
  const indexSuffix = index !== undefined ? `-${index}` : ''
  return `${userId}/${timestamp}${indexSuffix}-${baseName}.${ext}`
}

