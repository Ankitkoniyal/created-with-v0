type RateRecord = { hits: number; reset: number }

type RateBucket = Map<string, RateRecord>

const GLOBAL_STORE = "__coinmint_rate_limiter__"

function getStore(): RateBucket {
  if (!(GLOBAL_STORE in globalThis)) {
    ;(globalThis as any)[GLOBAL_STORE] = new Map<string, RateRecord>()
  }
  return (globalThis as any)[GLOBAL_STORE] as RateBucket
}

export function rateLimit(identifier: string, limit: number, windowMs: number) {
  const store = getStore()
  const now = Date.now()

  const record = store.get(identifier)

  if (!record || record.reset < now) {
    store.set(identifier, { hits: 1, reset: now + windowMs })
    return { allowed: true, remaining: limit - 1, reset: now + windowMs }
  }

  if (record.hits >= limit) {
    return { allowed: false, remaining: 0, reset: record.reset }
  }

  record.hits += 1
  store.set(identifier, record)
  return { allowed: true, remaining: limit - record.hits, reset: record.reset }
}

