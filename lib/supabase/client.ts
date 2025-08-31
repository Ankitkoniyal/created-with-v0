import { createBrowserClient, type SupabaseClient } from "@supabase/ssr"

declare global {
  interface Window {
    __supabase?: { url?: string; key?: string }
  }
}

let supabaseBrowser: SupabaseClient | null = null

export function createClient(): SupabaseClient | null {
  const url =
    (typeof window !== "undefined" ? window.__supabase?.url : undefined) || process.env.NEXT_PUBLIC_SUPABASE_URL

  const anon =
    (typeof window !== "undefined" ? window.__supabase?.key : undefined) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    if (typeof window !== "undefined") {
      console.error(
        "[Supabase] Missing public env vars. Set NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings.",
      )
    }
    return null
  }

  if (supabaseBrowser) return supabaseBrowser
  supabaseBrowser = createBrowserClient(url, anon)
  return supabaseBrowser
}
