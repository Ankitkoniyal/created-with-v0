import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient, type PostgrestError } from "@supabase/supabase-js"
import { CATEGORY_CONFIG, getCategorySlug } from "@/lib/categories"

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

interface CategoryRow {
  id: string
  name: string
  slug: string | null
  description: string | null
  created_at: string
}

const CATEGORY_GROUP_ATTEMPTS = [
  {
    columns: "category, category_slug, count:id",
    group: "category, category_slug",
    usesSlug: true,
  },
  {
    columns: "category, count:id",
    group: "category",
    usesSlug: false,
  },
] as const

const SUBCATEGORY_GROUP_ATTEMPTS = [
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

type CategoryGroupAttempt = (typeof CATEGORY_GROUP_ATTEMPTS)[number]
type SubcategoryGroupAttempt = (typeof SUBCATEGORY_GROUP_ATTEMPTS)[number]

const isMissingColumnError = (error: PostgrestError | null, column: string) => {
  if (!error) return false
  if (error.code === "42703") return true
  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase()
  return message.includes(column.toLowerCase()) || message.includes(column.replace(/_/g, " "))
}

const safeGroupedSelect = async (
  client: ReturnType<typeof createClient>,
  attempts: readonly (CategoryGroupAttempt | SubcategoryGroupAttempt)[],
  columnName: string,
  filter?: (builder: any) => any,
): Promise<{ rows: any[]; usesSlug: boolean; error?: PostgrestError | null }> => {
  for (const attempt of attempts) {
    let query: any = client.from("products").select(attempt.columns, { head: false }).group(attempt.group)
    if (filter) {
      query = filter(query)
    }
    const { data, error } = await query
    if (!error) {
      return { rows: data ?? [], usesSlug: (attempt as any).usesSlug as boolean }
    }
    if (!isMissingColumnError(error as PostgrestError, columnName)) {
      return { rows: [], usesSlug: attempt.usesSlug, error: error as PostgrestError }
    }
  }
  return { rows: [], usesSlug: false, error: null }
}

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

    let categories: CategoryRow[] = []
    let categoriesError: PostgrestError | null = null

    const { data: categoryRows, error: categoryFetchError } = await adminClient
      .from("categories")
      .select("id, name, slug, description, created_at")
      .order("name")

    if (categoryFetchError) {
      categoriesError = categoryFetchError as PostgrestError
    } else if (categoryRows) {
      categories = categoryRows as CategoryRow[]
    }

    const configBySlug = new Map(CATEGORY_CONFIG.map((config) => [config.slug, config]))
    const configByName = new Map(CATEGORY_CONFIG.map((config) => [config.name.toLowerCase(), config]))

    const resolveConfig = (name: string, slug: string | null) => {
      if (slug && configBySlug.has(slug)) return configBySlug.get(slug)
      const byName = configByName.get(name.toLowerCase())
      if (byName) return byName
      return null
    }

    const { rows: categoryCountRows, usesSlug: categoryUsesSlug, error: categoryCountError } = await safeGroupedSelect(
      adminClient,
      CATEGORY_GROUP_ATTEMPTS,
      "category_slug",
      (query) => query.or("category.not.is.null,category_slug.not.is.null"),
    )

    if (categoryCountError) {
      console.warn("Category count aggregation error", categoryCountError)
    }

    const categoryCountMap = new Map<
      string,
      {
        count: number
        slug: string | null
      }
    >()

    ;(categoryCountRows as any[]).forEach((row) => {
      const rawName = (row.category as string | null) ?? null
      const rawSlug = categoryUsesSlug ? ((row.category_slug as string | null) ?? null) : null
      const resolvedSlug = rawSlug ?? (rawName ? getCategorySlug(rawName) : null)
      const key = (resolvedSlug ?? rawName ?? "uncategorized").toLowerCase()
      const prev = categoryCountMap.get(key)
      const nextCount = Number(row.count) ?? 0
      categoryCountMap.set(key, {
        count: (prev?.count ?? 0) + nextCount,
        slug: resolvedSlug,
      })
    })

    const {
      rows: subcategoryCountRows,
      usesSlug: subcategoryUsesSlug,
      error: subcategoryCountError,
    } = await safeGroupedSelect(
      adminClient,
      SUBCATEGORY_GROUP_ATTEMPTS,
      "subcategory_slug",
      (query) => query.or("subcategory.not.is.null,subcategory_slug.not.is.null"),
    )

    if (subcategoryCountError) {
      console.warn("Subcategory count aggregation error", subcategoryCountError)
    }

    const subcategoryCountMap = new Map<string, number>()
    ;(subcategoryCountRows as any[]).forEach((row) => {
      const categoryName = (row.category as string | null) ?? "Uncategorized"
      const rawSubcategory = (row.subcategory as string | null) ?? ""
      const rawSubcategorySlug = subcategoryUsesSlug
        ? ((row.subcategory_slug as string | null) ?? null)
        : getCategorySlug(rawSubcategory)
      const identifier = (rawSubcategorySlug ?? rawSubcategory).toLowerCase()
      const key = `${categoryName.toLowerCase()}::${identifier}`
      const existing = subcategoryCountMap.get(key) ?? 0
      subcategoryCountMap.set(key, existing + (Number(row.count) ?? 0))
    })

    let finalCategories: Array<{
      id: string
      name: string
      slug: string
      description: string | null
      created_at: string
      item_count: number
      subcategories: Array<{ name: string; slug: string; item_count: number }>
    }> = []

    if (categories.length > 0) {
      finalCategories = categories.map((row) => {
        const slug = row.slug ?? getCategorySlug(row.name)
        const config = resolveConfig(row.name, slug)
        const subcategories =
          config?.subcategories.map((sub) => {
            const resolvedSlug = sub.slug ?? getCategorySlug(sub.name)
            const key = `${row.name.toLowerCase()}::${resolvedSlug.toLowerCase()}`
            const fallbackKey = `${row.name.toLowerCase()}::${sub.name.toLowerCase()}`
            return {
              name: sub.name,
              slug: resolvedSlug,
              item_count: subcategoryCountMap.get(key) ?? subcategoryCountMap.get(fallbackKey) ?? 0,
            }
          }) ?? []

        return {
          id: row.id,
          name: row.name,
          slug,
          description: row.description,
          created_at: row.created_at,
          item_count: (() => {
            const keyBySlug = categoryCountMap.get(slug.toLowerCase())
            if (keyBySlug) return keyBySlug.count
            const keyByName = categoryCountMap.get(row.name.toLowerCase())
            return keyByName?.count ?? 0
          })(),
          subcategories,
        }
      })
    } else {
      const now = new Date().toISOString()
      finalCategories = CATEGORY_CONFIG.map((config) => ({
        id: `config-${config.slug}`,
        name: config.name,
        slug: config.slug,
        description: null,
        created_at: now,
        item_count: (() => {
          const keyBySlug = categoryCountMap.get(config.slug.toLowerCase())
          if (keyBySlug) return keyBySlug.count
          const keyByName = categoryCountMap.get(config.name.toLowerCase())
          return keyByName?.count ?? 0
        })(),
        subcategories: config.subcategories.map((sub) => {
          const resolvedSlug = sub.slug ?? getCategorySlug(sub.name)
          const key = `${config.name.toLowerCase()}::${resolvedSlug.toLowerCase()}`
          const fallbackKey = `${config.name.toLowerCase()}::${sub.name.toLowerCase()}`
          return {
            name: sub.name,
            slug: resolvedSlug,
            item_count: subcategoryCountMap.get(key) ?? subcategoryCountMap.get(fallbackKey) ?? 0,
          }
        }),
      }))
    }

    // Calculate rising categories (last 7 days vs previous 7 days)
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Get recent category counts (last 7 days)
    const { rows: recentCategoryRows } = await safeGroupedSelect(
      adminClient,
      CATEGORY_GROUP_ATTEMPTS,
      "category_slug",
      (query) => query
        .or("category.not.is.null,category_slug.not.is.null")
        .gte("created_at", last7Days.toISOString()),
    )

    // Get previous period category counts (7-14 days ago)
    const { rows: previousCategoryRows } = await safeGroupedSelect(
      adminClient,
      CATEGORY_GROUP_ATTEMPTS,
      "category_slug",
      (query) => query
        .or("category.not.is.null,category_slug.not.is.null")
        .gte("created_at", previous7Days.toISOString())
        .lt("created_at", last7Days.toISOString()),
    )

    const recentCategoryMap = new Map<string, number>()
    recentCategoryRows.forEach((row: any) => {
      const rawName = (row.category as string | null) ?? null
      const rawSlug = categoryUsesSlug ? ((row.category_slug as string | null) ?? null) : null
      const resolvedSlug = rawSlug ?? (rawName ? getCategorySlug(rawName) : null)
      const key = (resolvedSlug ?? rawName ?? "uncategorized").toLowerCase()
      recentCategoryMap.set(key, (recentCategoryMap.get(key) ?? 0) + (Number(row.count) ?? 0))
    })

    const previousCategoryMap = new Map<string, number>()
    previousCategoryRows.forEach((row: any) => {
      const rawName = (row.category as string | null) ?? null
      const rawSlug = categoryUsesSlug ? ((row.category_slug as string | null) ?? null) : null
      const resolvedSlug = rawSlug ?? (rawName ? getCategorySlug(rawName) : null)
      const key = (resolvedSlug ?? rawName ?? "uncategorized").toLowerCase()
      previousCategoryMap.set(key, (previousCategoryMap.get(key) ?? 0) + (Number(row.count) ?? 0))
    })

    // Calculate growth rates - map by slug for lookup
    const categoryGrowthMap = new Map<string, { growth: number; recent: number; previous: number }>()
    finalCategories.forEach((cat) => {
      const key = cat.slug.toLowerCase()
      const recent = recentCategoryMap.get(key) ?? 0
      const previous = previousCategoryMap.get(key) ?? 0
      const growth = previous === 0 ? (recent > 0 ? 100 : 0) : ((recent - previous) / previous) * 100
      categoryGrowthMap.set(key, { growth, recent, previous })
    })

    // Get rising subcategories
    const { rows: recentSubcategoryRows } = await safeGroupedSelect(
      adminClient,
      SUBCATEGORY_GROUP_ATTEMPTS,
      "subcategory_slug",
      (query) => query
        .or("subcategory.not.is.null,subcategory_slug.not.is.null")
        .gte("created_at", last7Days.toISOString()),
    )

    const { rows: previousSubcategoryRows } = await safeGroupedSelect(
      adminClient,
      SUBCATEGORY_GROUP_ATTEMPTS,
      "subcategory_slug",
      (query) => query
        .or("subcategory.not.is.null,subcategory_slug.not.is.null")
        .gte("created_at", previous7Days.toISOString())
        .lt("created_at", last7Days.toISOString()),
    )

    const recentSubcategoryMap = new Map<string, number>()
    recentSubcategoryRows.forEach((row: any) => {
      const categoryName = (row.category as string | null) ?? "Uncategorized"
      const rawSubcategory = (row.subcategory as string | null) ?? ""
      const rawSubcategorySlug = subcategoryUsesSlug
        ? ((row.subcategory_slug as string | null) ?? null)
        : getCategorySlug(rawSubcategory)
      const identifier = (rawSubcategorySlug ?? rawSubcategory).toLowerCase()
      const key = `${categoryName.toLowerCase()}::${identifier}`
      recentSubcategoryMap.set(key, (recentSubcategoryMap.get(key) ?? 0) + (Number(row.count) ?? 0))
    })

    const previousSubcategoryMap = new Map<string, number>()
    previousSubcategoryRows.forEach((row: any) => {
      const categoryName = (row.category as string | null) ?? "Uncategorized"
      const rawSubcategory = (row.subcategory as string | null) ?? ""
      const rawSubcategorySlug = subcategoryUsesSlug
        ? ((row.subcategory_slug as string | null) ?? null)
        : getCategorySlug(rawSubcategory)
      const identifier = (rawSubcategorySlug ?? rawSubcategory).toLowerCase()
      const key = `${categoryName.toLowerCase()}::${identifier}`
      previousSubcategoryMap.set(key, (previousSubcategoryMap.get(key) ?? 0) + (Number(row.count) ?? 0))
    })

    // Add growth data to categories and subcategories
    const enrichedCategories = finalCategories.map((cat) => {
      const key = cat.slug.toLowerCase()
      const growthData = categoryGrowthMap.get(key) ?? { growth: 0, recent: 0, previous: 0 }
      const enrichedSubcategories = cat.subcategories.map((sub) => {
        const key = `${cat.name.toLowerCase()}::${sub.slug.toLowerCase()}`
        const fallbackKey = `${cat.name.toLowerCase()}::${sub.name.toLowerCase()}`
        const recent = recentSubcategoryMap.get(key) ?? recentSubcategoryMap.get(fallbackKey) ?? 0
        const previous = previousSubcategoryMap.get(key) ?? previousSubcategoryMap.get(fallbackKey) ?? 0
        const growth = previous === 0 ? (recent > 0 ? 100 : 0) : ((recent - previous) / previous) * 100
        return {
          ...sub,
          growth_rate: growth,
          recent_count: recent,
          previous_count: previous,
        }
      })
      return {
        ...cat,
        growth_rate: growthData.growth,
        recent_count: growthData.recent,
        previous_count: growthData.previous,
        subcategories: enrichedSubcategories,
      }
    })

    // Calculate most popular (sorted by total count)
    const mostPopularCategories = [...enrichedCategories].sort((a, b) => b.item_count - a.item_count)
    const mostPopularSubcategories = enrichedCategories
      .flatMap((cat) => cat.subcategories.map((sub) => ({ ...sub, category: cat.name, categorySlug: cat.slug })))
      .sort((a, b) => b.item_count - a.item_count)

    // Calculate rising (sorted by growth rate, minimum 3 items in recent period)
    const risingCategories = [...enrichedCategories]
      .filter((cat) => cat.recent_count >= 3)
      .sort((a, b) => b.growth_rate - a.growth_rate)
    
    const risingSubcategories = enrichedCategories
      .flatMap((cat) => cat.subcategories.map((sub) => ({ ...sub, category: cat.name, categorySlug: cat.slug })))
      .filter((sub) => sub.recent_count >= 2)
      .sort((a, b) => b.growth_rate - a.growth_rate)

    if (categoriesError) {
      const message = (categoriesError.message ?? "").toLowerCase()
      const relationMissing =
        categoriesError.code === "42P01" ||
        message.includes("does not exist") ||
        (message.includes("relation") && message.includes("categories"))

      if (!relationMissing) {
        console.warn("Categories fetch error", categoriesError)
        return NextResponse.json({ ok: false, error: categoriesError.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      ok: true,
      categories: enrichedCategories,
      mostPopular: {
        categories: mostPopularCategories.slice(0, 20),
        subcategories: mostPopularSubcategories.slice(0, 30),
      },
      rising: {
        categories: risingCategories.slice(0, 20),
        subcategories: risingSubcategories.slice(0, 30),
      },
    })
  } catch (error) {
    console.error("Admin categories list handler failed", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

