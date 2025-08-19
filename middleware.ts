// middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Optional: Protect routes
  const { pathname } = request.nextUrl
  const protectedRoutes = ["/dashboard", "/sell", "/messages", "/favorites"]
  const adminRoutes = ["/admin"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  if ((isProtectedRoute || isAdminRoute) && !session) {
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("redirectedFrom", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAdminRoute && session) {
    try {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

      if (!profile || profile.role !== "super_admin") {
        return NextResponse.redirect(new URL("/", request.url))
      }
    } catch (error) {
      console.error("Error checking user role in middleware:", error)
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // If user is logged in and tries to access auth pages, redirect to home
  const authRoutes = ["/auth/login", "/auth/signup"]
  const isAuthRoute = authRoutes.includes(pathname)

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth callback (handled by Supabase)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)",
  ],
}
