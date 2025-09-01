import { NextResponse } from "next/server"
import { cookies, headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function GET() {
  try {
    const cookieStore = cookies()
    const hdrs = headers()

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { ok: false, error: "Server missing SUPABASE_URL or SUPABASE_ANON_KEY" },
        { status: 500 },
      )
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, opts: any) {
          cookieStore.set({ name, value, ...opts })
        },
        remove(name: string, opts: any) {
          cookieStore.set({ name, value: "", ...opts, maxAge: 0 })
        },
      },
      headers: () => new Headers(hdrs),
    })

    const { data: sessionData, error } = await supabase.auth.getSession()
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
    }

    const session = sessionData.session
    return NextResponse.json({
      ok: true,
      hasSession: !!session,
      userId: session?.user?.id ?? null,
      userEmail: session?.user?.email ?? null,
      expiresAt: session?.expires_at ?? null,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 })
  }
}
