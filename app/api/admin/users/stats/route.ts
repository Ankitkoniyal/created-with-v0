import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

const DEFAULT_SUPER_ADMIN_EMAILS = ["ankit.koniyal000@gmail.com"]

const getAllowlistedEmails = () => {
  const env = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? ""
  const derived = env
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const merged = new Set([...DEFAULT_SUPER_ADMIN_EMAILS.map((email) => email.toLowerCase()), ...derived])
  return Array.from(merged)
}

const ALLOWLIST = getAllowlistedEmails()

const isSuperAdmin = (email: string | null | undefined, role: string | null | undefined) => {
  if (role === "super_admin" || role === "owner") return true
  if (!email) return false
  return ALLOWLIST.includes(email.toLowerCase())
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === "string" && id.length > 0) : []

    if (ids.length === 0) {
      return NextResponse.json({ ok: true, stats: {} })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: "service_key_missing" }, { status: 500 })
    }

    const actorEmail = user.email ?? (user.user_metadata?.email as string | undefined) ?? null
    const actorRole = (user.user_metadata?.role as string | undefined) ?? null

    if (!isSuperAdmin(actorEmail, actorRole)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const baseStats: Record<
      string,
      {
        totalAds: number
        activeAds: number
        soldAds: number
        totalViews: number
        favorites: number
        reportedAds: number
      }
    > = {}
    ids.forEach((id) => {
      baseStats[id] = {
        totalAds: 0,
        activeAds: 0,
        soldAds: 0,
        totalViews: 0,
        favorites: 0,
        reportedAds: 0,
      }
    })

    const [productResult, favoritesResult, reportsResult] = await Promise.all([
      adminClient.from("products").select("user_id, status, views").in("user_id", ids),
      adminClient
        .from("favorites")
        .select("user_id, count:id")
        .in("user_id", ids)
        .group("user_id"),
      adminClient
        .from("reports")
        .select("products!inner(user_id)")
        .in("products.user_id", ids),
    ])

    if (productResult.data) {
      productResult.data.forEach((row: { user_id: string; status: string | null; views: number | null }) => {
        const entry = baseStats[row.user_id]
        if (!entry) return
        entry.totalAds += 1
        entry.totalViews += row.views ?? 0
        if (row.status === "active") entry.activeAds += 1
        if (row.status === "sold") entry.soldAds += 1
      })
    }

    if (favoritesResult.data) {
      favoritesResult.data.forEach((row: { user_id: string; count: number }) => {
        const entry = baseStats[row.user_id]
        if (!entry) return
        entry.favorites = row.count ?? 0
      })
    }

    if (reportsResult.data) {
      reportsResult.data.forEach((row: { products: { user_id: string } | null }) => {
        const userId = row.products?.user_id
        if (!userId) return
        const entry = baseStats[userId]
        if (!entry) return
        entry.reportedAds += 1
      })
    }

    return NextResponse.json({ ok: true, stats: baseStats })
  } catch (error) {
    console.error("Admin user stats handler failed", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}


