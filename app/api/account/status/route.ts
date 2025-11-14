import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

type AccountStatus = "active" | "deactivated" | "suspended" | "banned" | "deleted"

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
    const { status, userId, reason }: { status?: AccountStatus; userId?: string; reason?: string | null } = body

    if (!status) {
      return NextResponse.json({ ok: false, error: "missing_status" }, { status: 400 })
    }

    const targetUserId = userId || actor.id
    const isSelf = targetUserId === actor.id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ ok: false, error: "service_key_missing" }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check actor's role from profiles table (more reliable than auth metadata)
    let actorRole: string | null = null
    try {
      const { data: actorProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", actor.id)
        .single()
      actorRole = actorProfile?.role || null
    } catch (err) {
      console.warn("Failed to fetch actor profile:", err)
    }

    // Also check auth metadata as fallback
    if (!actorRole) {
      actorRole = (actor.user_metadata?.role as string) || "user"
    }

    // Check if actor is super admin or owner
    const isSuperAdmin = actorRole === "super_admin" || actorRole === "owner" || actorRole === "admin"
    
    // Also check email allowlist (same as other admin routes)
    const DEFAULT_SUPER_ADMIN_EMAILS = ["ankit.koniyal000@gmail.com"]
    const env = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? ""
    const derived = env.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)
    const ALLOWLIST = new Set([...DEFAULT_SUPER_ADMIN_EMAILS.map((email) => email.toLowerCase()), ...derived])
    const isAllowlisted = actor.email ? ALLOWLIST.has(actor.email.toLowerCase()) : false

    if (!isSelf && !isSuperAdmin && !isAllowlisted) {
      return NextResponse.json({ 
        ok: false, 
        error: "forbidden",
        details: `Insufficient permissions. Role: ${actorRole}, Email: ${actor.email}`
      }, { status: 403 })
    }

    const metadata: Record<string, any> = {
      account_status: status,
      deactivated_at: status === "deactivated" ? new Date().toISOString() : null,
    }

    const { error: adminError } = await adminClient.auth.admin.updateUserById(targetUserId, {
      user_metadata: metadata,
    })

    if (adminError) {
      return NextResponse.json({ ok: false, error: adminError.message }, { status: 400 })
    }

    // Get previous status before update
    let previousStatus: string | null = null
    try {
      const { data: currentProfile } = await adminClient
        .from("profiles")
        .select("status")
        .eq("id", targetUserId)
        .single()
      previousStatus = currentProfile?.status ?? null
      
      // Also check auth metadata for account_status
      if (!previousStatus) {
        const { data: authUser } = await adminClient.auth.admin.getUserById(targetUserId)
        previousStatus = authUser?.user?.user_metadata?.account_status ?? null
      }
    } catch (err) {
      console.warn("Failed to fetch previous status", err)
    }

    try {
      const profileUpdate: Record<string, any> = {
        status,
        deactivated_at: metadata.deactivated_at,
        updated_at: new Date().toISOString(),
      }

      // Add deletion fields if status is deleted
      if (status === "deleted") {
        profileUpdate.deleted_at = new Date().toISOString()
        if (reason) {
          profileUpdate.deletion_reason = reason
        }
      } else if (reason && (status === "banned" || status === "suspended")) {
        // Store reason for banned/suspended users
        profileUpdate.deletion_reason = reason
      }

      await adminClient
        .from("profiles")
        .update(profileUpdate)
        .eq("id", targetUserId)
    } catch (profileError) {
      console.warn("Profile status update failed (likely missing column)", profileError)
    }

    // Track ban in banned_users table if status changed to banned/suspended/deactivated
    if (status && ["banned", "suspended", "deactivated"].includes(status) && !isSelf) {
      try {
        // Deactivate any existing active bans first
        await adminClient
          .from("banned_users")
          .update({ is_active: false })
          .eq("user_id", targetUserId)
          .eq("is_active", true)

        // Insert new ban record
        await adminClient
          .from("banned_users")
          .insert({
            user_id: targetUserId,
            banned_by: actor.id,
            reason: reason || "No reason provided",
            status_before: previousStatus || "active",
            status_after: status,
            banned_at: new Date().toISOString(),
            is_active: true,
          })
      } catch (trackError) {
        // Don't fail the whole request if tracking fails (table might not exist yet)
        console.warn("Failed to track banned user", trackError)
      }
    }

    return NextResponse.json({ ok: true, metadata, userId: targetUserId })
  } catch (error: any) {
    console.error("Account status update error", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}
