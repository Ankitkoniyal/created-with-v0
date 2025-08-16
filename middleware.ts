import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")

    if (code && request.nextUrl.pathname === "/auth/callback") {
      // Let the callback route handle the code exchange
      return res
    }

    // Refresh session if expired
    await supabase.auth.getSession()

    // Protected routes
    const protectedRoutes = ["/dashboard", "/sell"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    if (isProtectedRoute) {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return NextResponse.redirect(new URL("/auth/login", request.url))
      }
    }

    return res
  } catch (error) {
    console.error("[v0] Middleware error:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
