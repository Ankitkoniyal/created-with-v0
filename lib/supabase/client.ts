import { createBrowserClient, type SupabaseClient } from "@supabase/ssr"

declare global {
  interface Window {
    __supabase?: { url?: string; key?: string }
  }
}

let supabaseBrowser: SupabaseClient | null = null
let warnedMissingConfig = false

export function createClient(): SupabaseClient | null {
  const fromWindow = typeof window !== "undefined" ? window.__supabase : undefined

  const fromMeta = (() => {
    if (typeof document === "undefined")
      return { url: undefined as string | undefined, key: undefined as string | undefined }
    const url = document.querySelector('meta[name="supabase-url"]')?.getAttribute("content") || undefined
    const key = document.querySelector('meta[name="supabase-anon"]')?.getAttribute("content") || undefined
    return { url, key }
  })()

  const url = fromWindow?.url || fromMeta.url || process.env.NEXT_PUBLIC_SUPABASE_URL

  const anon = fromWindow?.key || fromMeta.key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    if (!warnedMissingConfig && typeof window !== "undefined") {
      console.warn(
        "[Supabase] Public config not found; client auth disabled on this page. If needed, inject config in layout.",
      )
      warnedMissingConfig = true
    }
    return null
  }

  if (supabaseBrowser) return supabaseBrowser
  supabaseBrowser = createBrowserClient(url, anon)
  return supabaseBrowser
}
