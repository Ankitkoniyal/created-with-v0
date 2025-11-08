const SUPABASE_PUBLIC_PATTERN = /https:\/\/.+\.supabase\.co\/storage\/v1\/object\/public\/.+/i

type Variant = "thumb" | "card" | "detail" | "avatar" | "large" // Added "large"

const VARIANTS: Record<Variant, { width: number; height?: number; quality: number; resize: "cover" | "contain" }> = {
  thumb: { width: 320, height: 240, quality: 70, resize: "cover" },
  card: { width: 512, height: 384, quality: 72, resize: "cover" },
  detail: { width: 1024, height: undefined, quality: 75, resize: "contain" },
  large: { width: 1200, height: undefined, quality: 80, resize: "contain" }, // Added this
  avatar: { width: 96, height: 96, quality: 70, resize: "cover" },
}

export function getOptimizedImageUrl(src: string | undefined | null, variant: Variant = "card"): string {
  if (!src) return "/placeholder.svg"

  const validVariants: Variant[] = ["thumb", "card", "detail", "avatar", "large"]
  const safeVariant = validVariants.includes(variant) ? variant : "card"

  if (!SUPABASE_PUBLIC_PATTERN.test(src)) return src

  const v = VARIANTS[safeVariant]

  try {
    const url = new URL(src)
    const params = url.searchParams

    const already = ["width", "height", "format", "quality", "resize"].some((k) => params.has(k))
    if (already) return src

    params.set("format", "webp")
    params.set("quality", String(v.quality))
    params.set("resize", v.resize)
    params.set("width", String(v.width))
    if (v.height) params.set("height", String(v.height))

    return url.toString()
  } catch {
    return src
  }
}
