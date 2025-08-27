import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { rateLimit } from "@/lib/rate-limiter"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  supabaseResponse.headers.set("X-Frame-Options", "DENY")
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff")
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  supabaseResponse.headers.set("X-XSS-Protection", "1; mode=block")
  supabaseResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ")

  supabaseResponse.headers.set("Content-Security-Policy", csp)

  const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  const isAPIRoute = request.nextUrl.pathname.startsWith("/api/")
  const isFormSubmission = request.method === "POST"

  if (isAPIRoute || isFormSubmission) {
    const limit = isAPIRoute ? 100 : 20 // API: 100/min, Forms: 20/min
    if (!rateLimit(clientIP, limit, 60000)) {
      return new NextResponse("Too Many Requests", { status: 429 })
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error && error.message !== "Auth session missing!") {
      console.error("Middleware auth error:", error.message)
      if (error.message.includes("invalid") || error.message.includes("expired")) {
        await supabase.auth.signOut()
      }
    }

    const protectedRoutes = ["/dashboard", "/sell", "/profile"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    if (isProtectedRoute && !user) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error("Middleware error:", error)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
