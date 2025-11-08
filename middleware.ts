// middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  // Use standard environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables missing in middleware")
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => 
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    // Public routes that don't require authentication
    const publicRoutes = [
      "/", 
      "/auth", 
      "/api/auth", 
      "/api/check-email",
      "/product", 
      "/search", 
      "/category",
      "/api/public"
    ];
    
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(route + "/")
    );

    // Redirect unauthenticated users trying to access protected routes
    if (!user && !isPublicRoute) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users away from auth pages
    if (user && request.nextUrl.pathname.startsWith("/auth")) {
      // Simple role-based redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const adminEmails = (process.env.SUPERADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
      const userEmail = (user.email || '').toLowerCase()

      const isSuperAdmin = profile?.role === 'super_admin' && (adminEmails.length === 0 || adminEmails.includes(userEmail))
      const redirectPath = isSuperAdmin ? '/superadmin' : '/dashboard'
      
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // Protect superadmin routes
    if (request.nextUrl.pathname.startsWith("/superadmin") && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const adminEmails = (process.env.SUPERADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
      const userEmail = (user.email || '').toLowerCase()

      const isSuperAdmin = profile?.role === 'super_admin' && (adminEmails.length === 0 || adminEmails.includes(userEmail))

      if (!isSuperAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

  } catch (error) {
    console.error("Middleware error:", error)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
