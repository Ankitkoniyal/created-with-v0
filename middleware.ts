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

    // Protect all authenticated routes (not just admin routes)
    const publicRoutes = ["/", "/auth", "/api/auth", "/public"];
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(route + "/")
    );

    // If user is not authenticated and trying to access protected route, redirect to login
    if (!user && !isPublicRoute) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname + request.nextUrl.search)

      logger.info("Redirecting unauthenticated user", {
        from: request.nextUrl.pathname,
        to: "/auth/login",
      })

      return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and trying to access auth pages, redirect to appropriate dashboard
    if (user && request.nextUrl.pathname.startsWith("/auth")) {
      // Fetch user profile to determine where to redirect
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        logger.error("Error fetching user profile in auth redirect", profileError, {
          userId: user.id,
          path: request.nextUrl.pathname,
        })
        
        // Default to home if we can't verify the user's role
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Normalize role comparison
      const userRole = String(profile.role).trim().toLowerCase();
      
      // For extra security, verify the email matches the expected super admin email
      const expectedSuperAdminEmail = "ankit.koniyal000@gmail.com";
      const isSuperAdmin = userRole === 'super_admin' && user.email === expectedSuperAdminEmail;

      const redirectPath = isSuperAdmin ? '/superadmin' : '/dashboard';
      
      logger.info("Redirecting authenticated user from auth page", {
        userId: user.id,
        userRole: profile.role,
        userEmail: user.email,
        redirectPath: redirectPath,
      })

      return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // Check for superadmin role if accessing superadmin routes
    if (request.nextUrl.pathname.startsWith("/superadmin") && user) {
      // Fetch user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        logger.error("Error fetching user profile", profileError, {
          userId: user.id,
          path: request.nextUrl.pathname,
        })
        
        // Redirect to dashboard if we can't verify the user's role
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // DEBUG: Log role information
      console.log("[MIDDLEWARE DEBUG] User role:", profile.role);
      console.log("[MIDDLEWARE DEBUG] User role type:", typeof profile.role);
      console.log("[MIDDLEWARE DEBUG] User email:", user.email);

      // Normalize role comparison (case-insensitive, trim whitespace)
      const userRole = String(profile.role).trim().toLowerCase();
      
      // For extra security, verify the email matches the expected super admin email
      const expectedSuperAdminEmail = "ankit.koniyal000@gmail.com";
      
      // ONLY allow the specific super_admin user to access superadmin routes
      const isSuperAdmin = userRole === 'super_admin' && user.email === expectedSuperAdminEmail;

      console.log("[MIDDLEWARE DEBUG] Normalized role:", userRole);
      console.log("[MIDDLEWARE DEBUG] Is super admin:", isSuperAdmin);

      if (!isSuperAdmin) {
        logger.info("Access denied to superadmin route for non-superadmin user", {
          userId: user.id,
          userRole: profile.role,
          userEmail: user.email,
          normalizedRole: userRole,
          path: request.nextUrl.pathname,
        })
        
        // Redirect to regular dashboard if not the specific super admin
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
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
  // Protect all routes except public ones
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}