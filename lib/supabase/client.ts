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
  const url = fromWindow?.url || fromMeta.url || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = fromWindow?.key || fromMeta.key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return { url, anon }
}

async function ensureRuntimeConfig() {
  if (typeof window === "undefined") return
  const { url, anon } = readInlineConfig()
  if (url && anon) return

  if (!fetchingConfig) {
    fetchingConfig = (async () => {
      try {
        const res = await fetch("/api/public/supabase", { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
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
      } catch {
        // swallow; we'll warn later if still missing
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
  if (!url || !anon) {
    await ensureRuntimeConfig()
    const after = readInlineConfig()
    url = after.url
    anon = after.anon
  }

  if (!url || !anon) {
    if (!warnedMissingConfig && typeof window !== "undefined") {
      console.warn("[Supabase] Public config not found; client features are disabled on this page.")
      warnedMissingConfig = true
    }
    return null
  }

  supabaseBrowser = createBrowserClient(url, anon)
  return supabaseBrowser
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

  const url = fromWindow?.url || fromMeta.url || process.env.NEXT_PUBLIC_SUPABASE_URL

  const anon = fromWindow?.key || fromMeta.key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    if (!warnedMissingConfig && typeof window !== "undefined") {
      console.warn("[Supabase] Public config not found; client features are disabled on this page.")
      warnedMissingConfig = true
    }
    return null
  }

  if (supabaseBrowser) return supabaseBrowser
  supabaseBrowser = createBrowserClient(url, anon)
  return supabaseBrowser
}
