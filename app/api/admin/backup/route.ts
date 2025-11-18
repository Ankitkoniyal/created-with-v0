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

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role - support both super_admin and owner roles, plus email allowlist
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .maybeSingle()

    // If profile doesn't exist, check email allowlist
    if (profileError || !profile) {
      // Check if email is in allowlist as fallback
      if (!isSuperAdmin(user.email, null)) {
        console.error("Backup access denied - profile not found and email not in allowlist", {
          userId: user.id,
          email: user.email,
          profileError,
        })
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
      }
    } else {
      // Check role or email allowlist
      if (!isSuperAdmin(profile.email || user.email, profile.role)) {
        console.error("Backup access denied - insufficient permissions", {
          userId: user.id,
          email: user.email,
          role: profile.role,
        })
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
      }
    }

    // Use service role key to bypass RLS for complete backup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Service configuration missing" },
        { status: 500 }
      )
    }

    // Create admin client that bypasses RLS
    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fetch all critical data for backup
    const timestamp = new Date().toISOString().split("T")[0]

    // Fetch users/profiles (exclude sensitive data)
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, email, full_name, phone, location, role, status, created_at, updated_at")
      .order("created_at", { ascending: false })

    // Fetch products/ads
    const { data: products } = await adminClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })

    // Fetch categories
    const { data: categories } = await adminClient
      .from("categories")
      .select("*")
      .order("name", { ascending: true })

    // Fetch messages
    const { data: messages } = await adminClient
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })

    // Fetch favorites
    const { data: favorites } = await adminClient
      .from("favorites")
      .select("*")
      .order("created_at", { ascending: false })

    // Fetch ratings (includes comments now)
    const { data: ratings } = await adminClient
      .from("user_ratings")
      .select("*")
      .order("created_at", { ascending: false })

    // Fetch platform settings
    const { data: settings } = await adminClient
      .from("platform_settings")
      .select("*")

    // Fetch reported ads
    const { data: reports } = await adminClient
      .from("reported_ads")
      .select("*")
      .order("created_at", { ascending: false })

    // Fetch moderation logs
    const { data: moderationLogs } = await adminClient
      .from("moderation_logs")
      .select("*")
      .order("created_at", { ascending: false })

    // Fetch audit logs
    const { data: auditLogs } = await adminClient
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000) // Limit to last 1000 entries

    // Compile backup data
    const backupData = {
      metadata: {
        backup_date: new Date().toISOString(),
        backup_type: "full",
        version: "1.0",
        generated_by: user.email,
      },
      data: {
        profiles: profiles || [],
        products: products || [],
        categories: categories || [],
        messages: messages || [],
        favorites: favorites || [],
        ratings: ratings || [],
        // Comments are now in user_ratings table, no separate table needed
        settings: settings || [],
        reports: reports || [],
        moderation_logs: moderationLogs || [],
        audit_logs: auditLogs || [],
      },
      statistics: {
        total_users: profiles?.length || 0,
        total_products: products?.length || 0,
        total_categories: categories?.length || 0,
        total_messages: messages?.length || 0,
        total_favorites: favorites?.length || 0,
        total_ratings: ratings?.length || 0,
        // Comments are included in ratings (ratings_with_comments field in user_rating_stats)
        total_reports: reports?.length || 0,
      },
    }

    // Return as downloadable JSON file
    const fileName = `backup-${timestamp}.json`
    
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Backup error:", error)
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    )
  }
}

