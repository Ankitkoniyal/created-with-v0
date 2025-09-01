import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email query param" }, { status: 400 })
    }

    const url = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Server missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 },
      )
    }

    const admin = createClient(url, serviceKey)

    // 1) Check Supabase Auth user existence
    const userRes = await admin.auth.admin.getUserByEmail(email)
    const authUser = userRes.data?.user || null

    // 2) If we found an auth user, check profiles table by auth user id (FK)
    let profile: any = null
    if (authUser?.id) {
      const { data: prof, error: profErr } = await admin
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()
      if (!profErr) profile = prof
    }

    return NextResponse.json({
      ok: true,
      email,
      authUserExists: !!authUser,
      authUserId: authUser?.id || null,
      profileExists: !!profile,
      profile,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 })
  }
}
