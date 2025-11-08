// middleware.ts
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next()

  // Public routes that don't require any auth checks
  const publicRoutes = [
    "/",
    "/auth",
    "/api",
    "/product", 
    "/search",
    "/category",
    "/sell",
    "/about",
    "/contact",
    "/_next",
    "/favicon.ico"
  ]

  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(route + "/")
  )

  // If it's a public route, just continue
  if (isPublicRoute) {
    return response
  }

  // For protected routes, do a simple check
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('sb-access-token') || 
                         request.cookies.get('supabase-auth-token')

    // If no session cookie and trying to access protected route, redirect to login
    if (!sessionCookie && !isPublicRoute) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

  } catch (error) {
    console.error("Middleware error:", error)
    // On error, allow access (fail open) to prevent breaking the site
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
