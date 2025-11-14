import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient, type PostgrestError } from "@supabase/supabase-js"

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

interface LocalityRow {
  id: string
  name: string
  city: string | null
  state: string | null
  pincode: string | null
  created_at: string
}

const FALLBACK_LOCALITIES = [
  { id: "sample-1", name: "Downtown", city: "Sample City", state: "Sample Province", pincode: "000001" },
  { id: "sample-2", name: "Uptown", city: "Sample City", state: "Sample Province", pincode: "000002" },
  { id: "sample-3", name: "City Center", city: "Sample City", state: "Sample Province", pincode: "000003" },
]

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 })
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

    let localities: LocalityRow[] = []
    let localityError: PostgrestError | null = null

    const { data: localityRows, error } = await adminClient
      .from("localities")
      .select("id, name, city, state, pincode, created_at")
      .order("name")

    if (error) {
      localityError = error as PostgrestError
    } else if (localityRows) {
      localities = localityRows as LocalityRow[]
    }

    // Get all location counts
    const { data: locationCountsRaw } = await adminClient
      .from("products")
      .select("location, count:id", { head: false })
      .not("location", "is", null)
      .group("location")

    // Get city, state, pincode counts
    const { data: cityCountsRaw } = await adminClient
      .from("products")
      .select("city, count:id", { head: false })
      .not("city", "is", null)
      .group("city")

    const { data: stateCountsRaw } = await adminClient
      .from("products")
      .select("province, count:id", { head: false })
      .not("province", "is", null)
      .group("province")

    const { data: pincodeCountsRaw } = await adminClient
      .from("products")
      .select("postal_code, count:id", { head: false })
      .not("postal_code", "is", null)
      .group("postal_code")

    const locationCountMap = new Map<string, number>()
    ;(locationCountsRaw ?? []).forEach((row: any) => {
      const name = row.location ?? "Unknown"
      locationCountMap.set(name, Number(row.count) ?? 0)
    })

    const cityCountMap = new Map<string, number>()
    ;(cityCountsRaw ?? []).forEach((row: any) => {
      const city = row.city ?? "Unknown"
      cityCountMap.set(city, Number(row.count) ?? 0)
    })

    const stateCountMap = new Map<string, number>()
    ;(stateCountsRaw ?? []).forEach((row: any) => {
      const state = row.province ?? "Unknown"
      stateCountMap.set(state, Number(row.count) ?? 0)
    })

    const pincodeCountMap = new Map<string, number>()
    ;(pincodeCountsRaw ?? []).forEach((row: any) => {
      const pincode = row.postal_code ?? "Unknown"
      pincodeCountMap.set(pincode, Number(row.count) ?? 0)
    })

    // Calculate rising locations (last 7 days vs previous 7 days)
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Recent location counts
    const { data: recentLocationCountsRaw } = await adminClient
      .from("products")
      .select("location, count:id", { head: false })
      .not("location", "is", null)
      .gte("created_at", last7Days.toISOString())
      .group("location")

    // Previous period location counts
    const { data: previousLocationCountsRaw } = await adminClient
      .from("products")
      .select("location, count:id", { head: false })
      .not("location", "is", null)
      .gte("created_at", previous7Days.toISOString())
      .lt("created_at", last7Days.toISOString())
      .group("location")

    const recentLocationMap = new Map<string, number>()
    ;(recentLocationCountsRaw ?? []).forEach((row: any) => {
      const name = row.location ?? "Unknown"
      recentLocationMap.set(name, Number(row.count) ?? 0)
    })

    const previousLocationMap = new Map<string, number>()
    ;(previousLocationCountsRaw ?? []).forEach((row: any) => {
      const name = row.location ?? "Unknown"
      previousLocationMap.set(name, Number(row.count) ?? 0)
    })

    const finalLocalities =
      localities.length > 0
        ? localities.map((loc) => {
            const recent = recentLocationMap.get(loc.name) ?? 0
            const previous = previousLocationMap.get(loc.name) ?? 0
            const growth = previous === 0 ? (recent > 0 ? 100 : 0) : ((recent - previous) / previous) * 100
            return {
              id: loc.id,
              name: loc.name,
              city: loc.city,
              state: loc.state,
              pincode: loc.pincode,
              created_at: loc.created_at,
              item_count: locationCountMap.get(loc.name) ?? 0,
              growth_rate: growth,
              recent_count: recent,
              previous_count: previous,
              city_count: loc.city ? cityCountMap.get(loc.city) ?? 0 : 0,
              state_count: loc.state ? stateCountMap.get(loc.state) ?? 0 : 0,
              pincode_count: loc.pincode ? pincodeCountMap.get(loc.pincode) ?? 0 : 0,
            }
          })
        : FALLBACK_LOCALITIES.map((loc) => {
            const recent = recentLocationMap.get(loc.name) ?? 0
            const previous = previousLocationMap.get(loc.name) ?? 0
            const growth = previous === 0 ? (recent > 0 ? 100 : 0) : ((recent - previous) / previous) * 100
            return {
              id: loc.id,
              name: loc.name,
              city: loc.city,
              state: loc.state,
              pincode: loc.pincode,
              created_at: new Date().toISOString(),
              item_count: locationCountMap.get(loc.name) ?? 0,
              growth_rate: growth,
              recent_count: recent,
              previous_count: previous,
              city_count: loc.city ? cityCountMap.get(loc.city) ?? 0 : 0,
              state_count: loc.state ? stateCountMap.get(loc.state) ?? 0 : 0,
              pincode_count: loc.pincode ? pincodeCountMap.get(loc.pincode) ?? 0 : 0,
            }
          })

    // Calculate most popular (sorted by total count)
    const mostPopularLocalities = [...finalLocalities].sort((a, b) => b.item_count - a.item_count)

    // Calculate rising (sorted by growth rate, minimum 3 items in recent period)
    const risingLocalities = [...finalLocalities]
      .filter((loc) => loc.recent_count >= 3)
      .sort((a, b) => b.growth_rate - a.growth_rate)

    // Get sub-locations breakdown (cities, states, pincodes)
    const cities = Array.from(cityCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const states = Array.from(stateCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const pincodes = Array.from(pincodeCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    if (localityError) {
      const message = (localityError.message ?? "").toLowerCase()
      const relationMissing =
        localityError.code === "42P01" ||
        message.includes("does not exist") ||
        (message.includes("relation") && message.includes("localities"))
      if (!relationMissing) {
        console.warn("Localities fetch error", localityError)
        return NextResponse.json({ ok: false, error: localityError.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      ok: true,
      localities: finalLocalities,
      mostPopular: {
        localities: mostPopularLocalities.slice(0, 20),
        cities: cities.slice(0, 20),
        states: states.slice(0, 20),
        pincodes: pincodes.slice(0, 20),
      },
      rising: {
        localities: risingLocalities.slice(0, 20),
      },
      subLocations: {
        cities,
        states,
        pincodes,
      },
    })
  } catch (error) {
    console.error("Admin localities list handler failed", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

