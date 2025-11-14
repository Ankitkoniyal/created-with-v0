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

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user: actor },
    } = await supabase.auth.getUser()

    if (!actor) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { userId }: { userId?: string } = body

    if (!userId) {
      return NextResponse.json({ ok: false, error: "missing_user_id" }, { status: 400 })
    }

    const actorEmail = actor.email ?? (actor.user_metadata?.email as string | undefined) ?? null
    const actorRole = (actor.user_metadata?.role as string | undefined) ?? null

    if (!isSuperAdmin(actorEmail, actorRole)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ ok: false, error: "service_key_missing" }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Delete from profiles table first (cascades to related data)
    const { error: profileError } = await adminClient.from("profiles").delete().eq("id", userId)

    if (profileError) {
      console.error("Failed to delete profile", profileError)
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 400 })
    }

    // Delete auth user (this will also cascade delete the profile if CASCADE is set)
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Failed to delete auth user", authError)
      // Don't fail if profile was deleted - partial success
      return NextResponse.json({ 
        ok: true, 
        warning: "Profile deleted but auth user deletion failed. You may need to delete manually from Supabase dashboard.",
        error: authError.message 
      })
    }

    return NextResponse.json({ ok: true, userId })
  } catch (error: any) {
    console.error("User delete handler failed", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

