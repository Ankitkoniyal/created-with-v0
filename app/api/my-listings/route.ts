import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

function getSupabaseServer() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServerClient(url, key)
}

export async function GET(req: Request) {
  const supabase = getSupabaseServer()
  if (!supabase) {
    return NextResponse.json({ listings: [], error: "supabase-missing-config" }, { status: 200 })
  }

  // Derive the authenticated user from cookies/session
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    return NextResponse.json({ listings: [], error: "unauthorized" }, { status: 401 })
  }

  // Optional: limit for future pagination
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10) || 50, 100)

  // Fetch only fields the dashboard needs. Adjust if schema differs.
  const { data, error } = await supabase
    .from("products")
    .select("id,title,price,status,views,category,created_at,user_id,images,primary_image")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    // Always return JSON so client parsing never crashes
    return NextResponse.json({ listings: [], error: error.message }, { status: 200 })
  }

  // Normalize shape: ensure images is an array, falling back to primary_image if needed
  const listings =
    (data || []).map((r: any) => ({
      ...r,
      images: Array.isArray(r.images) ? r.images : r.primary_image ? [r.primary_image] : [],
    })) ?? []

  return NextResponse.json({ listings }, { status: 200 })
}
