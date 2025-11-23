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

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = user.email ?? (user.user_metadata?.email as string | undefined) ?? null
    const userRole = (user.user_metadata?.role as string | undefined) ?? null

    if (!isSuperAdmin(userEmail, userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", "global")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = user.email ?? (user.user_metadata?.email as string | undefined) ?? null
    const userRole = (user.user_metadata?.role as string | undefined) ?? null

    if (!isSuperAdmin(userEmail, userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ error: "Settings payload required" }, { status: 400 })
    }

    // Use service role for update to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Service key missing" }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Ensure id is set
    const payload = {
      ...settings,
      id: "global",
      updated_at: new Date().toISOString(),
    }

    // Normalize auto_approve_delay_minutes
    if (payload.auto_approve_delay_minutes === undefined || payload.auto_approve_delay_minutes === "" || payload.auto_approve_delay_minutes === null) {
      payload.auto_approve_delay_minutes = null
    } else {
      const numValue = parseInt(String(payload.auto_approve_delay_minutes), 10)
      payload.auto_approve_delay_minutes = isNaN(numValue) || numValue < 0 ? null : numValue
    }

    const { data, error } = await adminClient
      .from("platform_settings")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single()

    if (error) {
      console.error("Settings save error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        { 
          error: error.message || "Failed to save settings",
          code: error.code,
          details: error.details,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Settings save exception:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

