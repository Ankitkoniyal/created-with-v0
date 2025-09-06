import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function getSupabaseServer() {
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("[v0] Supabase config check - URL exists:", !!url, "Key exists:", !!key)

    if (!url || !key) {
      console.log("[v0] Missing Supabase config")
      return null
    }

    let cookieStore
    try {
      cookieStore = cookies()
      console.log("[v0] Cookies accessed successfully")
    } catch (cookieError) {
      console.error("[v0] Cookie access error:", cookieError)
      return null
    }

    const client = createServerClient(url, key, {
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value
          } catch (err) {
            console.error("[v0] Cookie get error:", err)
            return undefined
          }
        },
      },
    })

    console.log("[v0] Supabase server client created")
    return client
  } catch (error) {
    console.error("[v0] getSupabaseServer error:", error)
    return null
  }
}

export async function GET(req: Request) {
  console.log("[v0] === My-listings API called ===")

  try {
    const supabase = getSupabaseServer()
    if (!supabase) {
      console.log("[v0] Supabase client creation failed")
      return NextResponse.json(
        {
          listings: [],
          error: "Supabase configuration error",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Getting user session...")

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      console.log("[v0] Auth error or no user:", userErr?.message)
      return NextResponse.json(
        {
          listings: [],
          error: "Authentication required",
        },
        { status: 401 },
      )
    }

    console.log("[v0] User authenticated:", user.email)

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10) || 50, 100)

    console.log("[v0] Querying products for user:", user.id, "limit:", limit)

    const { data, error } = await supabase
      .from("products")
      .select(
        "id,title,description,price,status,views,category,created_at,user_id,primary_image,images,condition,location",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Database error:", error.message, error.code)
      return NextResponse.json(
        {
          listings: [],
          error: "Database error: " + error.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Query successful, found", data?.length || 0, "listings")

    const listings = (data || []).map((r: any) => {
      const generateAdId = (productId: string, createdAt: string) => {
        const date = new Date(createdAt)
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const day = date.getDate().toString().padStart(2, "0")
        const idSuffix = productId.replace(/-/g, "").substring(0, 4).toUpperCase()
        return `AD${year}${month}${day}${idSuffix}`
      }

      return {
        ...r,
        images: r.images && Array.isArray(r.images) ? r.images : r.primary_image ? [r.primary_image] : [],
        adId: generateAdId(r.id, r.created_at),
        description: r.description || "",
        location: r.location || "",
        condition: r.condition || "Used",
      }
    })

    console.log("[v0] Returning", listings.length, "processed listings")
    return NextResponse.json({ listings }, { status: 200 })
  } catch (error: any) {
    console.error("[v0] === CRITICAL ERROR in my-listings API ===")
    console.error("[v0] Error type:", typeof error)
    console.error("[v0] Error message:", error?.message || "No message")
    console.error("[v0] Error stack:", error?.stack || "No stack")
    console.error("[v0] === END CRITICAL ERROR ===")

    return NextResponse.json(
      {
        listings: [],
        error: "Internal server error: " + (error?.message || "Unknown error"),
      },
      { status: 500 },
    )
  }
}
