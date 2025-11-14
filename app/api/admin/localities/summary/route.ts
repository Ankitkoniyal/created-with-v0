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

interface LocalitySummary {
  locality: {
    id: string | null
    name: string
    city: string | null
    state: string | null
    pincode: string | null
    totalAds: number
  }
  statusBreakdown: Array<{ status: string; count: number }>
  categoryBreakdown: Array<{ category: string; count: number }>
  subcategoryBreakdown: Array<{ subcategory: string; category: string; count: number }>
  uniqueSellers: number
  priceStats: {
    average: number | null
    minimum: number | null
    maximum: number | null
  }
  recentAds: Array<{
    id: string
    title: string
    price: number | null
    status: string | null
    created_at: string
    category: string | null
    subcategory: string | null
  }>
}

const normalizeLocationName = (value: string | null | undefined) => value?.trim() ?? ""

const isMissingColumnError = (error: PostgrestError | null, column: string) => {
  if (!error) return false
  if (error.code === "42703") return true
  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase()
  return message.includes(column.toLowerCase()) || message.includes(column.replace(/_/g, " "))
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const summaryId = url.searchParams.get("id")
    const summaryNameParam = url.searchParams.get("name")

    if (!summaryId && !summaryNameParam) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 })
    }

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

    let localityName = normalizeLocationName(summaryNameParam)
    let localityMeta: { id: string | null; name: string; city: string | null; state: string | null; pincode: string | null } | null =
      null

    if (summaryId) {
      const { data, error } = await adminClient.from("localities").select("id, name, city, state, pincode").eq("id", summaryId).maybeSingle()
      if (error) {
        const message = (error.message ?? "").toLowerCase()
        const relationMissing =
          error.code === "42P01" ||
          message.includes("does not exist") ||
          (message.includes("relation") && message.includes("localities"))
        if (!relationMissing) {
          console.warn("Failed to load locality metadata", error)
        }
      }
      if (data) {
        localityMeta = {
          id: data.id,
          name: data.name,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        }
        localityName = normalizeLocationName(data.name)
      }
    }

    if (!localityName) {
      return NextResponse.json({ ok: false, error: "locality_not_found" }, { status: 404 })
    }

    const [statusResult, categoryResult, subcategoryResult, recentAdsResult, sellersResult, priceSampleResult] =
      await Promise.all([
        adminClient
          .from("products")
          .select("status, count:id", { head: false })
          .eq("location", localityName)
          .group("status"),
        adminClient
          .from("products")
          .select("category, category_slug, count:id", { head: false })
          .eq("location", localityName)
          .group("category, category_slug"),
        (async () => {
          const attempts = [
            {
              columns: "category, subcategory, subcategory_slug, count:id",
              group: "category, subcategory, subcategory_slug",
              usesSlug: true,
            },
            {
              columns: "category, subcategory, count:id",
              group: "category, subcategory",
              usesSlug: false,
            },
          ] as const

          for (const attempt of attempts) {
            const { data, error } = await adminClient
              .from("products")
              .select(attempt.columns, { head: false })
              .eq("location", localityName)
              .group(attempt.group)

            if (!error) {
              return { data, usesSlug: attempt.usesSlug }
            }

            if (!isMissingColumnError(error as PostgrestError, "subcategory_slug")) {
              return { data: [], usesSlug: attempt.usesSlug, error }
            }
          }

          return { data: [], usesSlug: false }
        })(),
        adminClient
          .from("products")
          .select("id, title, price, status, created_at, category, subcategory")
          .eq("location", localityName)
          .order("created_at", { ascending: false })
          .limit(8),
        adminClient.from("products").select("user_id", { head: false }).eq("location", localityName),
        adminClient.from("products").select("price").eq("location", localityName),
      ])

    const statusBreakdown =
      statusResult.data?.map((row: any) => ({
        status: (row.status as string | null) ?? "unknown",
        count: Number(row.count) ?? 0,
      })) ?? []

    const categoryBreakdown =
      categoryResult.data?.map((row: any) => {
        const name = (row.category as string | null) ?? "Uncategorized"
        const slug = (row.category_slug as string | null) ?? null
        return {
          category: slug ?? name,
          count: Number(row.count) ?? 0,
        }
      }) ?? []

    const subcategoryData = (subcategoryResult as { data?: any[]; usesSlug?: boolean }).data ?? []
    const subcategoryUsesSlug = Boolean((subcategoryResult as { usesSlug?: boolean }).usesSlug)
    const subcategoryBreakdown = subcategoryData.map((row) => ({
      category: (row.category as string | null) ?? "Uncategorized",
      subcategory: subcategoryUsesSlug
        ? ((row.subcategory_slug as string | null) ?? (row.subcategory as string | null) ?? "unspecified")
        : ((row.subcategory as string | null) ?? "unspecified"),
      count: Number(row.count) ?? 0,
    }))

    const totalAds = statusBreakdown.reduce((acc, item) => acc + item.count, 0)

    const uniqueSellerCount = (() => {
      const ids = new Set<string>()
      ;(sellersResult.data ?? []).forEach((row: any) => {
        if (row.user_id) ids.add(row.user_id as string)
      })
      return ids.size
    })()

    const prices = (priceSampleResult.data ?? []).map((row: any) => Number(row.price)).filter((value) => Number.isFinite(value))
    const priceStats =
      prices.length === 0
        ? { average: null, minimum: null, maximum: null }
        : {
            average: Number((prices.reduce((acc, value) => acc + value, 0) / prices.length).toFixed(2)),
            minimum: Math.min(...prices),
            maximum: Math.max(...prices),
          }

    const recentAds =
      recentAdsResult.data?.map((row: any) => ({
        id: row.id as string,
        title: (row.title as string | null) ?? "Untitled listing",
        price: Number.isFinite(row.price) ? Number(row.price) : null,
        status: (row.status as string | null) ?? null,
        created_at: row.created_at as string,
        category: (row.category as string | null) ?? null,
        subcategory: (row.subcategory as string | null) ?? null,
      })) ?? []

    const summary: LocalitySummary = {
      locality: {
        id: localityMeta?.id ?? null,
        name: localityMeta?.name ?? localityName,
        city: localityMeta?.city ?? null,
        state: localityMeta?.state ?? null,
        pincode: localityMeta?.pincode ?? null,
        totalAds,
      },
      statusBreakdown,
      categoryBreakdown,
      subcategoryBreakdown,
      uniqueSellers: uniqueSellerCount,
      priceStats,
      recentAds,
    }

    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    console.error("Admin locality summary handler failed", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

