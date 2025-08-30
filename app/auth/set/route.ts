import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const event = String(body?.event || "")
    const access_token = body?.access_token as string | null
    const refresh_token = body?.refresh_token as string | null

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anon) {
      return NextResponse.json({ ok: false, reason: "supabase_env_missing" }, { status: 200 })
    }

    let res = NextResponse.json({ ok: true, event }, { status: 200 })

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          // rebuild response so we can attach cookies
          res = NextResponse.json({ ok: true, event }, { status: 200 })
          cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    })

    if (event === "SIGNED_OUT") {
      await supabase.auth.signOut()
      return res
    }

    if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && access_token && refresh_token) {
      // setSession will write the correct auth cookies to the response
      await supabase.auth.setSession({ access_token, refresh_token })
      return res
    }

    return res
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
