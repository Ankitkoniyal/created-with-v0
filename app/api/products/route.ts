import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

type Product = {
  id: string
  title: string
  price: number | null
  primary_image: string | null
  created_at: string
}

function getSupabaseServer() {
  // Prefer server env; fall back to public if present
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    // support workspace-prefixed vars if present
    (process.env as any).NEXT_PUBLIC_webspaceSUPABASE_URL
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (process.env as any).NEXT_PUBLIC_webspaceSUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServerClient(url, key)
}

export async function GET(req: Request) {
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
    .select("id,title,price,primary_image,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })

  if (afterCreatedAt && afterId) {
    // emulate keyset by filtering less-than the last seen tuple
    query = query.lt("created_at", afterCreatedAt).or(`created_at.eq.${afterCreatedAt},id.lt.${afterId}`)
  }

  const { data, error } = await query.limit(limit)
  if (error) {
    return NextResponse.json({ products: [], error: error.message }, { status: 200 })
  }

  const products: Product[] = (data || []) as any
  const last = products[products.length - 1]
  const next = products.length === limit && last ? { afterCreatedAt: last.created_at, afterId: last.id } : null

  return NextResponse.json({ products, next })
}
