import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseBrowser: SupabaseClient | null = null

export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, do NOT throw during render; return null and let callers guard.
  if (!url || !anon) {
    if (typeof window !== "undefined") {
      console.error(
        "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in Project Settings.",
      )
    }
    return null
  }

  if (supabaseBrowser) return supabaseBrowser
  supabaseBrowser = createSupabaseClient(url, anon)
  return supabaseBrowser
}
