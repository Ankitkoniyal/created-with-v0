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

interface ReportRow {
  id: string
  product_id: string | null
  reason: string | null
  reporter_id?: string | null
  user_id?: string | null
  reported_user_id?: string | null
  type?: string | null
  status?: string | null
  details?: string | null
  created_at: string
}

interface ProductRow {
  id: string
  title: string | null
  description: string | null
  price: number | null
  category: string | null
  created_at: string
  status: string | null
  user_id: string | null
  images?: string[] | null
  location?: string | null
  profiles?: { email: string | null } | null
}

const OPTIONAL_REPORT_COLUMNS = ["reported_user_id", "type", "status", "details"]
const REPORTER_COLUMN_VARIANTS = ["reporter_id", "user_id"]

const detectMissingColumn = (error: PostgrestError) => {
  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase()
  for (const column of [...OPTIONAL_REPORT_COLUMNS, ...REPORTER_COLUMN_VARIANTS]) {
    const normalized = column.replace(/_/g, " ")
    if (message.includes(column.toLowerCase()) || message.includes(normalized)) {
      return column
    }
  }
  return null
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10)
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 200)) : 100

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Start with user_id (most common based on actual usage in codebase)
    // Will fall back to reporter_id if user_id doesn't exist
    let reporterColumn = "user_id"
    const requiredColumns = ["id", "product_id", "reason", reporterColumn, "created_at"]
    const optionalColumns = [...OPTIONAL_REPORT_COLUMNS]
    let selectedColumns = [...requiredColumns, ...optionalColumns]

    let reportsData: ReportRow[] = []
    let reportError: PostgrestError | null = null
    let attempts = 0
    const maxAttempts = optionalColumns.length + 2

    while (attempts < maxAttempts) {
      let query = adminClient
        .from("reports")
        .select(selectedColumns.join(", "))
        .order("created_at", { ascending: false })
        .limit(limit)

      const { data, error } = await query
      if (!error) {
        reportsData = (data ?? []) as ReportRow[]
        reportError = null
        console.log(`[reports/list] Successfully loaded ${reportsData.length} reports using column: ${reporterColumn}`)
        break
      }

      const supabaseError = error as PostgrestError
      const message = (supabaseError.message ?? "").toLowerCase()
      const details = (supabaseError.details ?? "").toLowerCase()
      
      // Check if table is missing (more specific check)
      const relationMissing =
        supabaseError.code === "42P01" && 
        (message.includes("relation") || message.includes("table")) &&
        (message.includes("reports") || details.includes("reports"))
      
      if (relationMissing) {
        console.warn("Reports table appears to be missing", { code: supabaseError.code, message, details })
        return NextResponse.json({
          ok: true,
          ads: [],
          warning: "reports_table_missing",
        })
      }

      // Check for missing columns (error code 42703 = undefined_column)
      const missingColumn = detectMissingColumn(supabaseError)
      if (missingColumn) {
        console.warn(`Reports table missing column: ${missingColumn}`, { code: supabaseError.code, message })
        
        // Special handling: if user_id is missing, try reporter_id instead
        if (missingColumn === "user_id" && reporterColumn === "user_id") {
          reporterColumn = "reporter_id"
          const newRequiredColumns = ["id", "product_id", "reason", reporterColumn, "created_at"]
          selectedColumns = [...newRequiredColumns, ...optionalColumns]
          attempts += 1
          continue
        }
        
        selectedColumns = selectedColumns.filter((column) => column !== missingColumn)
        attempts += 1
        continue
      }

      // If it's not a missing column or table, it's a real error
      reportError = supabaseError
      break
    }

    if (reportError) {
      console.error("Failed to load reports", reportError)
      return NextResponse.json({ ok: false, error: reportError.message }, { status: 400 })
    }

    if (reportsData.length === 0) {
      return NextResponse.json({ ok: true, ads: [] })
    }

    const productIds = Array.from(
      reportsData.reduce((set, row) => {
        if (row.product_id) set.add(row.product_id)
        return set
      }, new Set<string>()),
    )

    const reporterIds = Array.from(
      reportsData.reduce((set, row) => {
        const reporterId = row.reporter_id ?? row.user_id ?? null
        if (reporterId) set.add(reporterId)
        return set
      }, new Set<string>()),
    )

    const [productsResult, reportersResult] = await Promise.all([
      productIds.length
        ? adminClient
            .from("products")
            .select(
              `
            id,
            title,
            description,
            price,
            category,
            created_at,
            status,
            user_id,
            images,
            location,
            profiles:profiles ( email )
          `,
            )
            .in("id", productIds)
        : Promise.resolve({ data: [], error: null }),
      reporterIds.length
        ? adminClient
            .from("profiles")
            .select("id, email")
            .in("id", reporterIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (productsResult.error) {
      console.error("Failed to load products for reports", productsResult.error)
    }

    if (reportersResult.error) {
      console.error("Failed to load reporter profiles", reportersResult.error)
    }

    const productMap = new Map<string, ProductRow>(
      ((productsResult.data ?? []) as ProductRow[]).map((product) => [product.id, product]),
    )

    const reporterEmailMap = new Map<string, string>(
      ((reportersResult.data ?? []) as Array<{ id: string; email: string | null }>).map((row) => [
        row.id,
        row.email ?? "Unknown reporter",
      ]),
    )

    const adsMap = new Map<
      string,
      {
        id: string
        title: string
        description: string
        price: number
        category: string
        created_at: string
        status: string
        location: string | null
        user_id: string
        user_email: string
        images: string[]
        reports: Array<{
          id: string
          reason: string
          severity: string
          reporter_email: string
          created_at: string
          details?: string | null
        }>
      }
    >()

    reportsData.forEach((row) => {
      const product = row.product_id ? productMap.get(row.product_id) : null
      if (!product) {
        return
      }

      if (!adsMap.has(product.id)) {
        adsMap.set(product.id, {
          id: product.id,
          title: product.title ?? "Untitled",
          description: product.description ?? "",
          price: product.price ?? 0,
          category: product.category ?? "Uncategorized",
          created_at: product.created_at,
          status: product.status ?? "pending",
          location: product.location ?? null,
          user_id: product.user_id ?? "unknown",
          user_email: product.profiles?.email ?? "Unknown",
          images: Array.isArray(product.images) ? (product.images as string[]) : [],
          reports: [],
        })
      }

      const entry = adsMap.get(product.id)
      if (!entry) return

      const reporterId = row.reporter_id ?? row.user_id ?? null
      const reporterEmail = reporterId ? reporterEmailMap.get(reporterId) ?? "Unknown reporter" : "Anonymous"
      
      // Map type to severity for UI compatibility (type can be 'conversation', 'product', etc.)
      // If type is not set, default to 'medium' severity
      const reportType = (row.type ?? "product").toLowerCase()
      let severity = "medium"
      if (reportType === "critical" || reportType === "high") {
        severity = reportType
      } else if (reportType === "low") {
        severity = "low"
      }

      entry.reports.push({
        id: row.id,
        reason: row.reason ?? "No reason provided",
        severity: severity,
        reporter_email: reporterEmail,
        created_at: row.created_at,
        details: row.details ?? null,
      })
    })

    const ads = Array.from(adsMap.values()).map((ad) => ({
      ...ad,
      report_count: ad.reports.length,
      highest_severity: ad.reports.reduce((acc, report) => {
        const ranking: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 }
        const current = ranking[acc] ?? 0
        const candidate = ranking[report.severity] ?? 0
        return candidate > current ? report.severity : acc
      }, "low"),
    }))

    console.log(`[reports/list] Returning ${ads.length} ads with reports (from ${reportsData.length} total reports)`)

    return NextResponse.json({
      ok: true,
      ads,
    })
  } catch (error) {
    console.error("Admin reports list handler failed", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

