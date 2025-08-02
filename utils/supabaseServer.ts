// utils/supabaseServer.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// The client creation is now wrapped in a function.
export function createClient() {
  console.log("--- New client is being created ---");
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options) {
          cookieStore.set(name, "", options)
        },
      },
    }
  )
}