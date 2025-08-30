import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true })
  try {
    // createServerClient refreshes cookies if a valid client session is present on the request
    createServerClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "", {
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
