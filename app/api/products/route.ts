import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

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

  const identifier =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  const limit = rateLimit(`products:post:${identifier}`, 5, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before posting another ad." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((limit.reset - Date.now()) / 1000).toString(),
        },
      },
    )
  }

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

    const productSchema = z.object({
      title: z.string().min(3).max(120),
      description: z.string().max(5000).optional().default(""),
      price: z.number().min(0).max(100000000).optional().default(0),
      condition: z.string().min(2).max(50),
      location: z.string().max(200).optional().default(""),
      city: z.string().max(100).optional().default(""),
      province: z.string().max(100).optional().default(""),
      images: z.array(z.string().url()).max(10).optional().default([]),
      category_id: z.number().int().positive().optional().default(1),
      category: z.string().min(2).max(100),
      subcategory: z.string().max(100).nullable().optional().default(null),
      brand: z.string().max(100).nullable().optional().default(null),
      model: z.string().max(100).nullable().optional().default(null),
      tags: z.array(z.string().max(40)).max(20).nullable().optional().default(null),
      features: z.record(z.any()).nullable().optional().default(null),
      youtube_url: z.string().url().nullable().optional().default(null),
      website_url: z.string().url().nullable().optional().default(null),
      show_mobile_number: z.boolean().optional().default(true),
    })

    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
    }

    const p = parsed.data

    // Prepare product data
    const productData = {
      user_id: user.id,
      title: p.title.trim(),
      description: p.description.trim(),
      price: p.price,
      condition: p.condition,
      location: p.location,
      city: p.city,
      province: p.province,
      images: p.images,
      primary_image: p.images[0] || null,
      category_id: p.category_id,
      category: p.category,
      subcategory: p.subcategory,
      brand: p.brand,
      model: p.model,
      tags: p.tags,
      features: p.features,
      youtube_url: p.youtube_url,
      website_url: p.website_url,
      show_mobile_number: p.show_mobile_number,
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
