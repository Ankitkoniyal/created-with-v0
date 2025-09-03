"use client"

import { createBrowserClient } from "@supabase/ssr"

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>

let cachedClient: SupabaseBrowserClient | null = null

function readMeta(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  return el?.content || undefined
}

function resolvePublicConfig(): { url: string; anonKey: string } | null {
  const w = typeof window !== "undefined" ? (window as any) : undefined
  const injectedUrl = w?.__supabase?.url as string | undefined
  const injectedAnon = w?.__supabase?.anonKey as string | undefined

  const envUrl =
    (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
    (process.env.NEXT_PUBLIC_webspaceSUPABASE_URL as string | undefined)
  const envAnon =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
    (process.env.NEXT_PUBLIC_webspaceSUPABASE_ANON_KEY as string | undefined)

  const metaUrl = readMeta("supabase-url")
  const metaAnon = readMeta("supabase-anon-key")

  const url = injectedUrl || envUrl || metaUrl
  const anonKey = injectedAnon || envAnon || metaAnon

  if (!url || !anonKey) return null
  return { url, anonKey }
}

export async function getBrowserSupabase(): Promise<SupabaseBrowserClient | null> {
  if (cachedClient) return cachedClient
  const cfg = resolvePublicConfig()
  if (!cfg) {
    console.warn("[v0] Supabase public config missing; skipping client init.")
    return null
  }
  cachedClient = createBrowserClient(cfg.url, cfg.anonKey)
  return cachedClient
}
