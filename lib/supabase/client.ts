import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

let supabaseInstance: any = null

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        // Let Supabase handle networking internally for better compatibility
      },
    )
  } catch (error) {
    console.error("[v0] Failed to initialize Supabase client:", error)
  }
}

// Create a mock client for when Supabase is not available
const mockClient = {
  auth: {
    signInWithPassword: () => Promise.reject(new Error("Supabase not configured")),
    signUp: () => Promise.reject(new Error("Supabase not configured")),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
    insert: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
    update: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
    delete: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
  }),
}

export const supabase = supabaseInstance || mockClient

// Export createClient for compatibility
export const createClient = () => supabase
