import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

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

interface RestoreRequest {
  backupData: any
  options?: {
    clearExisting?: boolean
    restoreTables?: string[]
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError || !profile) {
      if (!isSuperAdmin(user.email, null)) {
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
      }
    } else {
      if (!isSuperAdmin(profile.email || user.email, profile.role)) {
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
      }
    }

    // Parse request body
    const body: RestoreRequest = await request.json()
    const { backupData, options = {} } = body

    if (!backupData || !backupData.data) {
      return NextResponse.json({ error: "Invalid backup data" }, { status: 400 })
    }

    const { clearExisting = false, restoreTables } = options

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Service configuration missing" },
        { status: 500 }
      )
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const restoreResults: Record<string, { success: boolean; count: number; error?: string }> = {}
    const tablesToRestore = restoreTables || Object.keys(backupData.data)

    // Define restore order (respecting foreign key dependencies)
    const restoreOrder = [
      "categories",      // No dependencies
      "profiles",        // Referenced by products, messages, etc.
      "products",        // Referenced by messages, favorites
      "messages",        // Depends on profiles, products
      "favorites",       // Depends on profiles, products
      "user_ratings",    // Depends on profiles
      "reported_ads",    // Depends on products, profiles
      "moderation_logs", // Depends on products, profiles
      "audit_logs",      // Depends on profiles
      "platform_settings", // Independent
    ]

    // Filter restore order to only include tables we want to restore
    const orderedTables = restoreOrder.filter(table => tablesToRestore.includes(table))

    // Clear existing data if requested
    if (clearExisting) {
      for (const table of orderedTables.reverse()) {
        // Delete in reverse order of dependencies
        try {
          const { error } = await adminClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")
          if (error) {
            console.warn(`Failed to clear table ${table}:`, error.message)
          }
        } catch (err) {
          console.warn(`Error clearing table ${table}:`, err)
        }
      }
    }

    // Restore data in dependency order
    for (const tableName of orderedTables) {
      const tableData = backupData.data[tableName]
      
      if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
        restoreResults[tableName] = { success: true, count: 0 }
        continue
      }

      try {
        // Batch insert (Supabase has a limit, so we'll do 100 at a time)
        const batchSize = 100
        let inserted = 0
        let errors: any[] = []

        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize)
          
          // Remove id fields to let database generate new ones (unless it's a specific table that needs IDs)
          const cleanedBatch = batch.map((row: any) => {
            const cleaned = { ...row }
            // For some tables, we might want to preserve IDs (like settings)
            if (tableName === "platform_settings" || tableName === "categories") {
              // Keep ID for these tables
            } else {
              // Remove ID to avoid conflicts (let DB generate new ones)
              delete cleaned.id
            }
            return cleaned
          })

          const { data, error } = await adminClient
            .from(tableName)
            .insert(cleanedBatch)
            .select()

          if (error) {
            errors.push(error)
            console.error(`Error restoring batch in ${tableName}:`, error)
          } else {
            inserted += data?.length || 0
          }
        }

        if (errors.length > 0 && inserted === 0) {
          restoreResults[tableName] = {
            success: false,
            count: 0,
            error: errors[0].message || "Insert failed",
          }
        } else {
          restoreResults[tableName] = {
            success: true,
            count: inserted,
            error: errors.length > 0 ? `${errors.length} batch errors (partial restore)` : undefined,
          }
        }
      } catch (error: any) {
        restoreResults[tableName] = {
          success: false,
          count: 0,
          error: error.message || "Unknown error",
        }
      }
    }

    // Summary
    const totalRestored = Object.values(restoreResults).reduce((sum, r) => sum + r.count, 0)
    const failedTables = Object.entries(restoreResults)
      .filter(([_, r]) => !r.success)
      .map(([table, _]) => table)

    return NextResponse.json({
      success: failedTables.length === 0,
      message: `Restored ${totalRestored} records across ${Object.keys(restoreResults).length} tables`,
      results: restoreResults,
      failedTables: failedTables.length > 0 ? failedTables : undefined,
      backupMetadata: backupData.metadata,
    })
  } catch (error: any) {
    console.error("Restore error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to restore backup" },
      { status: 500 }
    )
  }
}

