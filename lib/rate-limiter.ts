const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(identifier: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }

  const current = rateLimitMap.get(identifier)

  if (!current) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= limit) {
    return false
  }

  current.count++
  return true
}
