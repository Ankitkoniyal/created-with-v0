// middleware.ts
import { NextResponse, type NextRequest } from "next/server"
import { isMaintenanceMode } from "@/lib/platform-settings"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Rate limiting for API routes (except auth and admin)
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth") && !pathname.startsWith("/api/admin")) {
    const identifier = getClientIdentifier(request)
    
    // Stricter limits for POST/PUT/DELETE
    const isWriteOperation = ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)
    const limit = isWriteOperation
      ? { maxRequests: 20, windowMs: 60000 } // 20 requests per minute for writes
      : { maxRequests: 100, windowMs: 60000 } // 100 requests per minute for reads
    
    const result = rateLimit(identifier, limit)
    
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(limit.maxRequests),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.resetTime),
          },
        }
      )
    }
    
    // Add rate limit headers to successful responses
    const response = NextResponse.next()
    response.headers.set("X-RateLimit-Limit", String(limit.maxRequests))
    response.headers.set("X-RateLimit-Remaining", String(result.remaining))
    response.headers.set("X-RateLimit-Reset", String(result.resetTime))
  }
  
  // Security headers for all responses
  const response = pathname.startsWith("/api") ? NextResponse.next() : await handleMaintenance(request)
  
  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  
  // Only add CSP for HTML pages (not API)
  if (!pathname.startsWith("/api")) {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://vercel.live; frame-ancestors 'none';"
    )
  }
  
  return response
}

async function handleMaintenance(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Allow admin and API routes to bypass maintenance mode
  const isAdminRoute = pathname.startsWith("/superadmin") || pathname.startsWith("/api/admin")
  const isApiRoute = pathname.startsWith("/api")
  const isAuthRoute = pathname.startsWith("/auth")
  
  if (!isAdminRoute && !isApiRoute && !isAuthRoute) {
    try {
      const maintenanceEnabled = await isMaintenanceMode()
      
      if (maintenanceEnabled) {
        // Return maintenance page
        return new NextResponse(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Maintenance Mode</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  text-align: center;
                  padding: 20px;
                }
                .container {
                  max-width: 500px;
                  background: rgba(255, 255, 255, 0.1);
                  backdrop-filter: blur(10px);
                  border-radius: 20px;
                  padding: 40px;
                  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                }
                h1 { font-size: 2.5rem; margin: 0 0 20px; }
                p { font-size: 1.1rem; opacity: 0.9; line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🔧 Maintenance Mode</h1>
                <p>We're currently performing maintenance to improve your experience. Please check back soon.</p>
              </div>
            </body>
          </html>
          `,
          {
            status: 503,
            headers: {
              "Content-Type": "text/html",
              "Retry-After": "3600", // Retry after 1 hour
            },
          }
        )
      }
    } catch (error) {
      // If settings can't be loaded, continue normally (fail open)
      const logger = await import("@/lib/logger")
      logger.logger.warn("Failed to check maintenance mode", { error })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
