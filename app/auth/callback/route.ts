import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)

  try {
    const code = requestUrl.searchParams.get("code")

    if (code) {
      const cookieStore = cookies()
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anon) {
        console.error("[v0] Auth callback missing Supabase envs")
        return NextResponse.redirect(new URL("/auth/login?error=callback_env", requestUrl.origin))
      }

      const supabase = createServerClient(url, anon, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      })

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error("[v0] Auth callback error:", error)
        return NextResponse.redirect(new URL("/auth/login?error=confirmation_failed", requestUrl.origin))
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const fullName =
            (user.user_metadata?.full_name as string | undefined) ||
            (user.user_metadata?.name as string | undefined) ||
            ""
          const phone = (user.user_metadata?.phone as string | undefined) || ""
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email,
              full_name: fullName || null,
              phone: phone || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          )
        }
      } catch (upsertErr) {
        console.warn("[v0] Profile ensure in callback failed:", (upsertErr as any)?.message)
      }
    }

    // Always land users on home with a flag
    return NextResponse.redirect(new URL("/?confirmed=true", requestUrl.origin))
  } catch (error) {
    console.error("[v0] Auth callback exception:", error)
    return NextResponse.redirect(new URL("/auth/login?error=callback_error", requestUrl.origin))
  }
}
