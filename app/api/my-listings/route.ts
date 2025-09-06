import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function getSupabaseServer() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const cookieStore = cookies()
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

export async function GET(req: Request) {
  try {
    console.log("[v0] My-listings API called")

    const supabase = getSupabaseServer()
    if (!supabase) {
      console.log("[v0] Supabase config missing")
      return NextResponse.json({ listings: [], error: "supabase-missing-config" }, { status: 200 })
    }

    console.log("[v0] Getting user session")
    let user
    try {
      const {
        data: { user: authUser },
        error: userErr,
      } = await supabase.auth.getUser()

      if (userErr) {
        console.log("[v0] Auth error:", userErr.message)
        return NextResponse.json({ listings: [], error: "auth-error" }, { status: 401 })
      }

      if (!authUser) {
        console.log("[v0] No user found")
        return NextResponse.json({ listings: [], error: "unauthorized" }, { status: 401 })
      }

      user = authUser
      console.log("[v0] User found:", user.email)
    } catch (authError: any) {
      console.error("[v0] Auth exception:", authError)
      return NextResponse.json({ listings: [], error: "auth-exception" }, { status: 500 })
    }

    // Optional: limit for future pagination
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10) || 50, 100)

    console.log("[v0] Querying products for user:", user.id)
    const { data, error } = await supabase
      .from("products")
      .select("id,title,price,status,views,category,created_at,user_id,primary_image")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ listings: [], error: error.message }, { status: 500 })
    }

    console.log("[v0] Found", data?.length || 0, "listings")

    const listings = (data || []).map((r: any) => ({
      ...r,
      images: r.primary_image ? [r.primary_image] : [],
    }))

    return NextResponse.json({ listings }, { status: 200 })
  } catch (error: any) {
    console.error("[v0] My-listings API error:", error)
    return NextResponse.json(
      {
        listings: [],
        error: "Internal server error: " + (error.message || "Unknown error"),
      },
      { status: 500 },
    )
  }
}
