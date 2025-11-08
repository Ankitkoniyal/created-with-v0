import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string }
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid email" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      )
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    // If server isn't configured to check, SOFT-ALLOW so real sign-in decides outcome.
    if (!url || !serviceRole) {
      return NextResponse.json(
        { ok: true, exists: true, reason: "not_configured" },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      )
    }

    const admin = createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await admin.auth.admin.getUserByEmail(email)

    if (error) {
      // Network/admin error → do NOT block; let password sign-in decide
      return NextResponse.json(
        { ok: true, exists: true, reason: "check_failed" },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      )
    }

    return NextResponse.json(
      { ok: true, exists: Boolean(data?.user) },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    )
  } catch (_err) {
    // Parse/network error → do NOT block
    return NextResponse.json(
      { ok: true, exists: true, reason: "exception_soft_allow" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    )
  }
}
