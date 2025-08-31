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
      return new NextResponse(JSON.stringify({ ok: false, reason: "supabase_env_missing" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      })
    }

    let res = new NextResponse(JSON.stringify({ ok: true, event }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    })

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          res = new NextResponse(JSON.stringify({ ok: true, event }), {
            status: 200,
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          })
          cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    })

    if (event === "SIGNED_OUT") {
      await supabase.auth.signOut()
      return res
    }

    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token })
        return res
      }
      return new NextResponse(JSON.stringify({ ok: false, event, reason: "missing_tokens" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      })
    }

    return res
  } catch {
    return new NextResponse(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    })
  }
}
