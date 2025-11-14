import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { insertNotifications } from "@/lib/notifications"

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
      data: { user: actor },
    } = await supabase.auth.getUser()

    if (!actor) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 })
    }

    const actorEmail = actor.email ?? (actor.user_metadata?.email as string | undefined) ?? null
    const actorRole = (actor.user_metadata?.role as string | undefined) ?? null

    if (!isSuperAdmin(actorEmail, actorRole)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      userId,
      title,
      message,
      type,
      link,
      priority,
      data,
    }: {
      userId?: string
      title?: string
      message?: string
      type?: string
      link?: string
      priority?: string
      data?: Record<string, unknown>
    } = body

    if (!userId || !title || !message) {
      return NextResponse.json({ ok: false, error: "missing_required_fields" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ ok: false, error: "service_key_missing" }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const result = await insertNotifications(adminClient, [
      {
        userId,
        actorId: actor.id,
        title,
        message,
        type: type ?? "general",
        link: link ?? null,
        priority: (priority as "info" | "warning" | "critical") ?? "info",
        data: data ?? null,
      },
    ])

    if (!result.success) {
      if (result.skipped) {
        return NextResponse.json({ ok: true, warning: "notifications_table_missing" })
      }
      return NextResponse.json({ ok: false, error: result.error?.message ?? "notification_failed" }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Notification send handler failed", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

