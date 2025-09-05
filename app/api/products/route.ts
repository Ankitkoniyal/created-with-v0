import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

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
    console.log("[v0] /api/products error", { ms, error: error.message })
    return NextResponse.json({ products: [], error: error.message }, { status: 200 })
  }
  console.log("[v0] /api/products ok", { ms, count: data?.length ?? 0, slow: ms > 400 })

  const rows = (data || []) as Product[]
  const products = rows.map((r) => ({
    ...r,
    images: r.images && Array.isArray(r.images) ? r.images : r.primary_image ? [r.primary_image] : [],
    description: r.description || "",
    location: r.location || `${r.city || ""}, ${r.province || ""}`.replace(/^,\s*|,\s*$/g, "") || "",
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

    // Validate required fields
    if (!body.title || !body.category || !body.condition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Prepare product data
    const productData = {
      user_id: user.id,
      title: body.title.trim(),
      description: body.description?.trim() || "",
      price: body.price || 0,
      condition: body.condition,
      location: body.location || "",
      city: body.city || "",
      province: body.province || "",
      images: body.images || [],
      primary_image: body.images?.[0] || null,
      category_id: body.category_id || 1,
      category: body.category || "",
      subcategory: body.subcategory || null,
      brand: body.brand || null,
      model: body.model || null,
      tags: body.tags || null,
      features: body.features || null,
      youtube_url: body.youtube_url || null,
      website_url: body.website_url || null,
      show_mobile_number: body.show_mobile_number ?? true,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("products").insert(productData).select().single()

    const ms = Date.now() - start

    if (error) {
      console.log("[v0] POST /api/products error", { ms, error: error.message })
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] POST /api/products ok", { ms, id: data.id })
    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error) {
    const ms = Date.now() - start
    console.log("[v0] POST /api/products error", {
      ms,
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
