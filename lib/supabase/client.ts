import { createBrowserClient, type SupabaseClient } from "@supabase/ssr"

declare global {
  interface Window {
    __supabase?: { url?: string; key?: string }
  }
}

let supabaseBrowser: SupabaseClient | null = null
let warnedMissingConfig = false
let fetchingConfig: Promise<void> | null = null

function readInlineConfig() {
  const fromWindow = typeof window !== "undefined" ? window.__supabase : undefined
  const fromMeta = (() => {
    if (typeof document === "undefined") {
      return { url: undefined as string | undefined, key: undefined as string | undefined }
    }
    const url = document.querySelector('meta[name="supabase-url"]')?.getAttribute("content") || undefined
    const key = document.querySelector('meta[name="supabase-anon"]')?.getAttribute("content") || undefined
    return { url, key }
  })()

  const url =
    fromWindow?.url ||
    fromMeta.url ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_webspaceSUPABASE_URL

  const anon =
    fromWindow?.key ||
    fromMeta.key ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_webspaceSUPABASE_ANON_KEY

  return { url, anon }
}

async function ensureRuntimeConfig() {
  if (typeof window === "undefined") return
  const { url, anon } = readInlineConfig()
  if (url && anon) return

  if (!fetchingConfig) {
    fetchingConfig = (async () => {
      try {
        console.log("[v0] Fetching Supabase config from /api/public/supabase")
        const res = await fetch("/api/public/supabase", { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        console.log("[v0] Supabase config response:", { ok: data?.ok, hasUrl: !!data?.url, hasAnon: !!data?.anon })

        if (data?.ok && data.url && data.anon) {
          window.__supabase = { url: data.url, key: data.anon }
          const head = document.head
          if (head && !document.querySelector('meta[name="supabase-url"]')) {
            const mu = document.createElement("meta")
            mu.setAttribute("name", "supabase-url")
            mu.setAttribute("content", data.url)
            head.appendChild(mu)
          }
          if (head && !document.querySelector('meta[name="supabase-anon"]')) {
            const mk = document.createElement("meta")
            mk.setAttribute("name", "supabase-anon")
            mk.setAttribute("content", data.anon)
            head.appendChild(mk)
          }
        }
      } catch (err) {
        console.error("[v0] Failed to fetch Supabase config:", err)
      } finally {
        fetchingConfig = null
      }
    })()
  }
  await fetchingConfig
}

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (supabaseBrowser) return supabaseBrowser

  let { url, anon } = readInlineConfig()
  console.log("[v0] Initial Supabase config:", { hasUrl: !!url, hasAnon: !!anon })

  if (!url || !anon) {
    await ensureRuntimeConfig()
    const after = readInlineConfig()
    url = after.url
    anon = after.anon
    console.log("[v0] After runtime config:", { hasUrl: !!url, hasAnon: !!anon })
  }

  if (!url || !anon) {
    if (!warnedMissingConfig && typeof window !== "undefined") {
      console.error("[v0] Supabase config missing. URL:", !!url, "Anon:", !!anon)
      console.error("[v0] Available env vars:", {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_webspaceSUPABASE_URL: !!process.env.NEXT_PUBLIC_webspaceSUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_webspaceSUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_webspaceSUPABASE_ANON_KEY,
      })
      warnedMissingConfig = true
    }
    return null
  }

  try {
    console.log("[v0] Creating Supabase client with URL:", url.substring(0, 20) + "...")
    supabaseBrowser = createBrowserClient(url, anon)
    return supabaseBrowser
  } catch (err) {
    console.error("[v0] Failed to create Supabase client:", err)
    return null
  }
}

export function createClient(): SupabaseClient | null {
  const fromWindow = typeof window !== "undefined" ? window.__supabase : undefined

  const fromMeta = (() => {
    if (typeof document === "undefined") {
      return { url: undefined as string | undefined, key: undefined as string | undefined }
    }
    const url = document.querySelector('meta[name="supabase-url"]')?.getAttribute("content") || undefined
    const key = document.querySelector('meta[name="supabase-anon"]')?.getAttribute("content") || undefined
    return { url, key }
  })()

  const url =
    fromWindow?.url ||
    fromMeta.url ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_webspaceSUPABASE_URL

  const anon =
    fromWindow?.key ||
    fromMeta.key ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_webspaceSUPABASE_ANON_KEY

  if (!url || !anon) {
    if (!warnedMissingConfig && typeof window !== "undefined") {
      console.error("[v0] Supabase config missing. URL:", !!url, "Anon:", !!anon)
      console.error("[v0] Available env vars:", {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_webspaceSUPABASE_URL: !!process.env.NEXT_PUBLIC_webspaceSUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_webspaceSUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_webspaceSUPABASE_ANON_KEY,
      })
      warnedMissingConfig = true
    }
    return null
  }

  if (supabaseBrowser) return supabaseBrowser
  try {
    console.log("[v0] Creating Supabase client with URL:", url.substring(0, 20) + "...")
    supabaseBrowser = createBrowserClient(url, anon)
    return supabaseBrowser
  } catch (err) {
    console.error("[v0] Failed to create Supabase client:", err)
    return null
  }
}
