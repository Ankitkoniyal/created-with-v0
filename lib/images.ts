const SUPABASE_PUBLIC_PATTERN = /https:\/\/.+\.supabase\.co\/storage\/v1\/object\/public\/.+/i

type Variant = "thumb" | "card" | "detail" | "avatar"

const VARIANTS: Record<Variant, { width: number; height?: number; quality: number; resize: "cover" | "contain" }> = {
  thumb: { width: 320, height: 240, quality: 70, resize: "cover" },
  card: { width: 512, height: 384, quality: 72, resize: "cover" },
  detail: { width: 1024, height: undefined, quality: 75, resize: "contain" },
  avatar: { width: 96, height: 96, quality: 70, resize: "cover" },
}

/**
 * Returns an optimized (transformed) URL for Supabase Storage images.
 * - For Supabase URLs: appends width/height/format/webp/quality/resize params.
 * - For non-Supabase URLs: returns the original src unchanged.
 */
export function getOptimizedImageUrl(src: string | undefined | null, variant: Variant = "card"): string {
  if (!src) return ""
  if (!SUPABASE_PUBLIC_PATTERN.test(src)) return src

  const v = VARIANTS[variant]
  const url = new URL(src)
  const params = url.searchParams

  // Avoid double-appending if an optimization already exists
  const already = ["width", "height", "format", "quality", "resize"].some((k) => params.has(k))
  if (already) return src

  params.set("format", "webp")
  params.set("quality", String(v.quality))
  params.set("resize", v.resize)
  params.set("width", String(v.width))
  if (v.height) params.set("height", String(v.height))

  url.search = params.toString()
  return url.toString()
}
