import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { formatLocation, formatLocationString } from "@/lib/location-utils"
import { validateRequestBody, productSchema } from "@/lib/validation"
import { logger } from "@/lib/logger"

type Product = {
  id: string
  title: string
  price: number | null
  primary_image: string | null
  created_at: string
  price_type?: string | null
  province?: string | null
  images?: string[]
  description?: string
  location?: string
  condition?: string
  category?: string
  user_id?: string
}

function getSupabaseServer() {
  // Prefer server env; fall back to public if present
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServerClient(url, key)
}

export async function GET(req: Request) {
  const start = Date.now()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number.parseInt(searchParams.get("limit") || "12", 10) || 12, 50)
  // keyset cursor: created_at,id
  const afterCreatedAt = searchParams.get("afterCreatedAt")
  const afterId = searchParams.get("afterId")

  const supabase = getSupabaseServer()
  if (!supabase) {
    return NextResponse.json({ products: [], next: null, meta: { reason: "supabase-missing-config" } }, { status: 200 })
  }

  let query = supabase
    .from("products")
    .select(
      "id,title,description,price,primary_image,images,created_at,price_type,province,city,location,condition,category,user_id",
      { count: "exact" },
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })

  if (afterCreatedAt && afterId) {
    // emulate keyset by filtering less-than the last seen tuple
    query = query.or(`created_at.lt.${afterCreatedAt},and(created_at.eq.${afterCreatedAt},id.lt.${afterId})`)
  }

  const { data, error } = await query.limit(limit)
  const ms = Date.now() - start
  if (error) {
    logger.error("Products fetch error", { ms, error: error.message })
    return NextResponse.json({ products: [], error: error.message }, { status: 200 })
  }
  if (ms > 400) {
    logger.warn("Slow products query", { ms, count: data?.length ?? 0 })
  }

  const rows = (data || []) as Product[]
  const products = rows.map((r) => ({
    ...r,
    images: r.images && Array.isArray(r.images) ? r.images : r.primary_image ? [r.primary_image] : [],
    description: r.description || "",
    location: r.location ? formatLocationString(r.location) : formatLocation(r.city || "", r.province || ""),
  }))

  const last = products[products.length - 1]
  const next = products.length === limit && last ? { afterCreatedAt: last.created_at, afterId: last.id } : null

  return NextResponse.json({ products, next })
}

export async function POST(req: Request) {
  const start = Date.now()

  const supabase = getSupabaseServer()
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  // Get authenticated user
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Validate request body
    const validation = validateRequestBody(productSchema, body)
    if (!validation.success) {
      logger.warn("Product creation validation failed", { error: validation.error, userId: user.id })
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Prepare product data with validated inputs
    const productData = {
      user_id: user.id,
      title: validation.data.title,
      description: validation.data.description || "",
      price: validation.data.price || 0,
      condition: validation.data.condition,
      location: validation.data.location || "",
      city: validation.data.city || "",
      province: validation.data.province || "",
      images: Array.isArray(body.images) ? body.images.slice(0, 8) : [], // Limit to 8 images
      primary_image: Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : null,
      category_id: body.category_id || 1,
      category: validation.data.category,
      subcategory: body.subcategory || null,
      brand: body.brand || null,
      model: body.model || null,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : null, // Limit tags
      features: Array.isArray(body.features) ? body.features.slice(0, 20) : null, // Limit features
      youtube_url: validation.data.youtube_url || null,
      website_url: validation.data.website_url || null,
      show_mobile_number: validation.data.show_mobile_number ?? true,
      status: "pending", // New ads require admin approval before going live
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("products").insert(productData).select().single()

    const ms = Date.now() - start

    if (error) {
      logger.error("Product creation failed", { ms, error: error.message, userId: user.id })
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    logger.info("Product created", { ms, productId: data.id, userId: user.id })
    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error) {
    const ms = Date.now() - start
    logger.error("Product creation exception", {
      ms,
      error: error instanceof Error ? error.message : "Unknown error",
      userId: user.id,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
