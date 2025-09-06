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

    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 10000))

    let user
    try {
      const result = (await Promise.race([authPromise, timeoutPromise])) as any
      const {
        data: { user: authUser },
        error: userErr,
      } = result

      if (userErr) {
        console.log("[v0] Auth error:", userErr.message)
        return NextResponse.json(
          {
            listings: [],
            error: "Authentication failed: " + userErr.message,
          },
          { status: 401 },
        )
      }

      if (!authUser) {
        console.log("[v0] No authenticated user")
        return NextResponse.json(
          {
            listings: [],
            error: "No authenticated user",
          },
          { status: 401 },
        )
      }

      user = authUser
      console.log("[v0] User authenticated:", user.email)
    } catch (authError: any) {
      console.error("[v0] Auth exception:", authError.message)
      return NextResponse.json(
        {
          listings: [],
          error: "Authentication error: " + authError.message,
        },
        { status: 500 },
      )
    }

    // Optional: limit for future pagination
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10) || 50, 100)

    console.log("[v0] Querying products for user:", user.id, "limit:", limit)

    const queryPromise = supabase
      .from("products")
      .select("id,title,price,status,views,category,created_at,user_id,primary_image")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    const queryTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timeout")), 15000),
    )

    const { data, error } = (await Promise.race([queryPromise, queryTimeoutPromise])) as any

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

    const listings = (data || []).map((r: any) => ({
      ...r,
      images: r.primary_image ? [r.primary_image] : [],
    }))

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
