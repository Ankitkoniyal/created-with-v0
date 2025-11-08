import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true })
  try {
    // createServerClient refreshes cookies if a valid client session is present on the request
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnon) {
      console.warn("[auth/sync] Supabase env missing; skipping session refresh")
      return res
    }

    createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        get(name: string) {
          return (
            req.headers
              .get("cookie")
              ?.split(";")
              .map((c) => c.trim())
              .find((c) => c.startsWith(`${name}=`))
              ?.split("=")[1] || ""
          )
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, { path: "/", ...options })
        },
        remove(name: string, options: any) {
          res.cookies.set(name, "", { path: "/", expires: new Date(0), ...options })
        },
      },
    })
  } catch {}
  return res
}
