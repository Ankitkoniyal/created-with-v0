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

interface ListRequest {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  role?: string
}

interface UserProfileRow {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  location: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string | null
  status: string | null
  role: string | null
  deleted_at: string | null
  deletion_reason: string | null
  last_sign_in_at: string | null
  email_confirmed_at: string | null
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

    const body = (await request.json().catch(() => ({}))) as ListRequest
    const page = Number.isFinite(body.page) && body.page! >= 0 ? body.page! : 0
    const pageSize = Number.isFinite(body.pageSize) && body.pageSize! > 0 ? Math.min(body.pageSize!, 100) : 25
    const search = body.search?.trim() ?? ""
    const status = body.status?.trim() ?? "all"
    const role = body.role?.trim() ?? "all"

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

    const from = page * pageSize
    const to = from + pageSize - 1

    const coreColumns = [
      "id",
      "email",
      "full_name",
      "phone",
      "location",
      "bio",
      "avatar_url",
      "created_at",
      "updated_at",
    ] as const

    const optionalColumns = ["status", "role", "deleted_at", "deletion_reason"] as const
    type OptionalColumn = (typeof optionalColumns)[number]

    const detectMissingProfileColumn = (error: PostgrestError): OptionalColumn | null => {
      const targets = optionalColumns
      const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase()
      for (const column of targets) {
        const variants = [column, `profiles.${column}`, `"${column}"`, `"profiles.${column}"`]
        if (variants.some((variant) => message.includes(variant.toLowerCase()))) {
          return column
        }
      }
      return null
    }

    let availableOptionalColumns = new Set<OptionalColumn>(optionalColumns)
    let statusColumnAvailable = true
    let roleColumnAvailable = true
    let deletedAtColumnAvailable = true
    let deletionReasonColumnAvailable = true

    let profiles: Array<Record<string, any>> | null = null
    let count: number | null = null
    let profileError: PostgrestError | null = null
    let attempts = 0
    const maxAttempts = optionalColumns.length + 1

    const pattern = search ? `%${search.replace(/%/g, "\\%").replace(/_/g, "\\_")}%` : null

    while (attempts < maxAttempts) {
      const selectedColumns = [...coreColumns, ...Array.from(availableOptionalColumns)]
      let query = adminClient
        .from("profiles")
        .select(selectedColumns.join(", "), { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

      if (status !== "all" && statusColumnAvailable) {
        query = query.eq("status", status)
      }

      if (role !== "all" && roleColumnAvailable) {
        query = query.eq("role", role)
      }

      if (pattern) {
        query = query.or(
          `email.ilike.${pattern},full_name.ilike.${pattern},phone.ilike.${pattern},location.ilike.${pattern}`,
          { foreignTable: undefined },
        )
      }

      const result = await query

      if (!result.error) {
        profiles = (result.data ?? []) as Array<Record<string, any>>
        count = result.count ?? null
        profileError = null
        break
      }

      const missingColumn = detectMissingProfileColumn(result.error as PostgrestError)
      if (!missingColumn) {
        profileError = result.error as PostgrestError
        break
      }

      availableOptionalColumns.delete(missingColumn)
      if (missingColumn === "status") statusColumnAvailable = false
      if (missingColumn === "role") roleColumnAvailable = false
      if (missingColumn === "deleted_at") deletedAtColumnAvailable = false
      if (missingColumn === "deletion_reason") deletionReasonColumnAvailable = false
      attempts += 1
    }

    if (profileError) {
      console.error("Failed to load profiles", profileError)
      return NextResponse.json(
        { ok: false, error: profileError.message ?? "failed_to_fetch_profiles" },
        { status: 400 },
      )
    }

    const profileRows = profiles ?? []
    const ids = profileRows.map((profile) => profile.id as string)

    const stats: Record<
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
      stats[id] = {
        totalAds: 0,
        activeAds: 0,
        soldAds: 0,
        totalViews: 0,
        favorites: 0,
        reportedAds: 0,
      }
    })

    if (ids.length > 0) {
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
          const entry = stats[row.user_id]
          if (!entry) return
          entry.totalAds += 1
          entry.totalViews += row.views ?? 0
          if (row.status === "active") entry.activeAds += 1
          if (row.status === "sold") entry.soldAds += 1
        })
      }

      if (favoritesResult.data) {
        favoritesResult.data.forEach((row: { user_id: string; count: number }) => {
          const entry = stats[row.user_id]
          if (!entry) return
          entry.favorites = row.count ?? 0
        })
      }

      if (reportsResult.data) {
        reportsResult.data.forEach((row: { products: { user_id: string } | null }) => {
          const userId = row.products?.user_id
          if (!userId) return
          const entry = stats[userId]
          if (!entry) return
          entry.reportedAds += 1
        })
      }
    }

    const authDetails = new Map<
      string,
      {
        last_sign_in_at: string | null
        email_confirmed_at: string | null
        account_status: string | null
      }
    >()

    if (ids.length > 0) {
      const admin = adminClient.auth.admin
      await Promise.allSettled(
        ids.map(async (userId) => {
          try {
            const { data, error } = await admin.getUserById(userId)
            if (error || !data?.user) return
            authDetails.set(userId, {
              last_sign_in_at: data.user.last_sign_in_at ?? null,
              email_confirmed_at: data.user.email_confirmed_at ?? null,
              account_status:
                (data.user.user_metadata?.account_status as string | null | undefined) ??
                (data.user.user_metadata?.status as string | null | undefined) ??
                null,
            })
          } catch (error) {
            console.warn("Failed to load auth metadata for user", userId, error)
          }
        }),
      )
    }

    const users: UserProfileRow[] = profileRows.map((profile) => {
      const authMeta =
        authDetails.get(profile.id) ?? { last_sign_in_at: null, email_confirmed_at: null, account_status: null }
      const resolvedStatus =
        statusColumnAvailable && typeof profile.status !== "undefined"
          ? profile.status ?? authMeta.account_status ?? "active"
          : authMeta.account_status ?? "active"
      const resolvedRole =
        roleColumnAvailable && typeof profile.role !== "undefined" ? profile.role ?? "user" : profile.role ?? "user"
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name ?? null,
        phone: profile.phone ?? null,
        location: profile.location ?? null,
        bio: profile.bio ?? null,
        avatar_url: profile.avatar_url ?? null,
        created_at: profile.created_at,
        updated_at: profile.updated_at ?? null,
        status: resolvedStatus,
        role: resolvedRole,
        deleted_at: deletedAtColumnAvailable ? profile.deleted_at ?? null : null,
        deletion_reason: deletionReasonColumnAvailable ? profile.deletion_reason ?? null : null,
        last_sign_in_at: authMeta.last_sign_in_at,
        email_confirmed_at: authMeta.email_confirmed_at,
      }
    })

    const hasMore = count ? to + 1 < count : users.length === pageSize

    return NextResponse.json({
      ok: true,
      users,
      count: count ?? users.length,
      stats,
      page,
      pageSize,
      hasMore,
      supportsStatusFilter: statusColumnAvailable,
      supportsRoleFilter: roleColumnAvailable,
    })
  } catch (error) {
    console.error("Admin list users handler failed", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

