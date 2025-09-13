import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

function getSupabaseServer() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServerClient(url, key)
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const start = Date.now()
  const supabase = getSupabaseServer()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase config missing" }, { status: 500 })
  }

  const { id } = params

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,description,price,primary_image,images,created_at,price_type,province,city,location,condition,category,user_id"
    )
    .eq("id", id)
    .eq("status", "active")
    .single()

  const ms = Date.now() - start
    
  if (error || !data) {
    console.log("[v0] /api/products/[id] error", { ms, id, error: error?.message })
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  console.log("[v0] /api/products/[id] ok", { ms, id })

  // Normalize product (same style as your list endpoint)
  const product = {
    ...data,
    images: data.images && Array.isArray(data.images) ? data.images : data.primary_image ? [data.primary_image] : [],
    description: data.description || "",
    location:
      data.location || `${data.city || ""}, ${data.province || ""}`.replace(/^,\s*|,\s*$/g, "") || "",
  }

  return NextResponse.json(product, { 
    status: 200,
    headers: {
      "cache-control": "public, max-age=300",
    },
  })
}
