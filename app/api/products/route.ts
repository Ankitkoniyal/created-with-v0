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

  // Build query with lean select; adjust column names if your schema differs
  let query = supabase
    .from("products")
    .select("id,title,price,primary_image,created_at,price_type,province", { count: "exact" })
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
    images: r.primary_image ? [r.primary_image] : [],
  }))

  const last = products[products.length - 1]
  const next = products.length === limit && last ? { afterCreatedAt: last.created_at, afterId: last.id } : null

  return NextResponse.json({ products, next })
}
