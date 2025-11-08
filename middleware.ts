// middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Use standard environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables missing in middleware")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Auth error in middleware:", error)
      // Continue without user data
    }

    // Public routes that don't require authentication
    const publicRoutes = [
      "/", 
      "/auth", 
      "/api/auth", 
      "/product", 
      "/search", 
      "/category",
      "/api/public",
      "/sell", // Add sell route as public since it has its own auth handling
      "/about", // Add other public routes
      "/contact"
    ];
    
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(route + "/")
    );

    // Redirect unauthenticated users trying to access protected routes
    if (!user && !isPublicRoute && !request.nextUrl.pathname.startsWith('/api/')) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users away from auth pages (except callback)
    if (user && request.nextUrl.pathname.startsWith("/auth") && !request.nextUrl.pathname.includes("/auth/callback")) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const isSuperAdmin = profile?.role === 'super_admin' && user.email === "ankit.koniyal000@gmail.com"
        const redirectPath = isSuperAdmin ? '/superadmin' : '/dashboard'
        
        return NextResponse.redirect(new URL(redirectPath, request.url))
      } catch (profileError) {
        console.error("Profile fetch error:", profileError)
        // Default redirect if profile fetch fails
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Protect superadmin routes
    if (request.nextUrl.pathname.startsWith("/superadmin") && user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const isSuperAdmin = profile?.role === 'super_admin' && user.email === "ankit.koniyal000@gmail.com"

        if (!isSuperAdmin) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (profileError) {
        console.error("Superadmin check error:", profileError)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

  } catch (error) {
    console.error("Middleware error:", error)
    // Don't break the entire app on middleware errors
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
