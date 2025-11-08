import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anon) {
      return NextResponse.json({ ok: false, reason: "supabase_env_missing" }, { status: 200 })
    }

    let res = NextResponse.json({ ok: true })
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          res = NextResponse.json({ ok: true })
          cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, reason: "no_session" }, { status: 200 })
    }

    const fullName =
      (body?.fullName as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      ""
    const phone = (body?.phone as string | undefined) || (user.user_metadata?.phone as string | undefined) || ""

    // Upsert minimal profile. Assumes a 'profiles' table with primary key 'id' = auth.user.id
    const defaultRole = "user"
    const now = new Date().toISOString()

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          full_name: fullName || null,
          phone: phone || null,
          role: defaultRole,
          updated_at: now,
        },
        { onConflict: "id" },
      )

    if (error) {
      // If table/column mismatch, surface a soft failure; do not break login
      return NextResponse.json({ ok: false, reason: "upsert_failed", message: error.message }, { status: 200 })
    }

    return res
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: "exception", message: e?.message }, { status: 200 })
  }
}
