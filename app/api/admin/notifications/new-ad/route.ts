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
    const { productId, title, previewImage }: { productId?: string; title?: string; previewImage?: string | null } = body

    if (!productId || !title) {
      return NextResponse.json({ ok: false, error: "missing_parameters" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: "service_key_missing" }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: superAdmins, error: superAdminError } = await adminClient
      .from("profiles")
      .select("id, role, email")
      .or("role.eq.super_admin,role.eq.owner")

    if (superAdminError) {
      console.error("Failed to load super admin recipients", superAdminError)
      return NextResponse.json({ ok: false, error: superAdminError.message }, { status: 400 })
    }

    const allowlistedEmails = new Set(ALLOWLIST)

    const recipients =
      superAdmins
        ?.filter((profile) => profile?.id)
        .filter((profile) => {
          if (profile.role === "super_admin" || profile.role === "owner") return true
          if (profile.email && allowlistedEmails.has(profile.email.toLowerCase())) return true
          return false
        }) ?? []

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const notifications = recipients.map((profile) => ({
      userId: profile.id as string,
      actorId: user.id,
      title: "New ad pending review",
      message: `${user.email ?? "A user"} posted "${title}". Review it when you have a moment.`,
      type: "new_ad",
      data: {
        productId,
        title,
        previewImage: previewImage ?? null,
      },
    }))

    await insertNotifications(adminClient, notifications)

    return NextResponse.json({ ok: true, recipients: notifications.length })
  } catch (error) {
    console.error("Failed to create super admin notification for new ad", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

