// Simple in-memory rate limiting
// For production, consider using Redis or a dedicated service

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key]
      }
    })
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 100, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const { maxRequests, windowMs } = options

  // Get or create entry
  let entry = store[key]

  if (!entry || entry.resetTime < now) {
    // Create new window
    entry = {
      count: 1,
      resetTime: now + windowMs,
    }
    store[key] = entry
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

// Get client identifier from request
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")
  
  const ip = cfConnectingIp || realIp || (forwarded ? forwarded.split(",")[0].trim() : null) || "unknown"
  
  // Include pathname for per-endpoint limiting
  const url = new URL(request.url)
  return `${ip}:${url.pathname}`
}

