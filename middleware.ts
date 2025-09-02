import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { logger } from "@/lib/logger"
import { performanceMonitor } from "@/lib/performance-monitor"

export async function middleware(request: NextRequest) {
  const startTime = Date.now()

  let supabaseResponse = NextResponse.next({
    request,
  })

  // Allow preflight requests without protection
  if (request.method === "OPTIONS") {
    return supabaseResponse
  }

  // Prefer server envs; fall back to public only if needed.
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If config is missing, do NOT enforce auth (prevents redirect loop); let client-side guard handle it.
  if (!supabaseUrl || !supabaseAnonKey) {
    logger.warn("Middleware: Supabase env missing, skipping auth enforcement", {
      path: request.nextUrl.pathname,
    })
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  })

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error && error.message !== "Auth session missing!") {
      logger.warn("Middleware auth error", { error: error.message, path: request.nextUrl.pathname })

      if (error.message.includes("invalid") || error.message.includes("expired")) {
        await supabase.auth.signOut()
        logger.info("Cleared invalid session", { path: request.nextUrl.pathname })
      }
    }

    // Optional: if already logged in and visiting auth pages, send to home.
    // (Auth pages are already allowed early above.)
    // Client-side guards handle dashboard/sell/profile; enforce only admin surfaces here.
    const protectedRoutes = ["/admin", "/superadmin"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    if (isProtectedRoute && !user) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname + request.nextUrl.search)

      logger.info("Redirecting unauthenticated user", {
        from: request.nextUrl.pathname,
        to: "/auth/login",
      })

      return NextResponse.redirect(redirectUrl)
    }

    const responseTime = Date.now() - startTime
    performanceMonitor.recordMetric("middleware_request", responseTime, user?.id, {
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get("user-agent")?.slice(0, 100),
    })

    supabaseResponse.headers.set("X-Response-Time", `${responseTime}ms`)
  } catch (error) {
    logger.error("Middleware error", error as Error, {
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get("user-agent")?.slice(0, 100),
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/admin/:path*", "/superadmin/:path*"],
}
