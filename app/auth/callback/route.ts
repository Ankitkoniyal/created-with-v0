import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)

  try {
    const code = requestUrl.searchParams.get("code")

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[v0] Auth callback error:", error)
        return NextResponse.redirect(new URL("/auth/login?error=confirmation_failed", requestUrl.origin))
      }
    }

    return NextResponse.redirect(new URL("/?confirmed=true", requestUrl.origin))
  } catch (error) {
    console.error("[v0] Auth callback exception:", error)
    return NextResponse.redirect(new URL("/auth/login?error=callback_error", requestUrl.origin))
  }
}
