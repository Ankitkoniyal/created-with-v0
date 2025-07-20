import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Reads public Supabase environment variables.
 * In production / deployed previews these **must** be set in the hosting
 * dashboard.  When they are missing (local dev, Storybook, unit tests, etc.)
 * we fall back to a dummy client so the app can still render without
 * crashing.
 *
 * NOTE: the dummy credentials do NOT connect to a real backend – all
 * queries will fail – but they avoid hard runtime errors.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    `[Supabase] Environment variables "NEXT_PUBLIC_SUPABASE_URL" and/or \
"NEXT_PUBLIC_SUPABASE_ANON_KEY" are missing.

Add them in your hosting provider’s dashboard (e.g. Vercel → Project Settings → Environment Variables)
or create a local .env file when running locally.

Using a dummy client so the UI can still render - all Supabase requests \
will return errors until proper credentials are provided.`,
  )
}

// Always export a client: real when vars exist, dummy otherwise
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://dummy.supabase.co",
  supabaseAnonKey || "public-anon-key",
)

// ---- OPTIONAL: typed helper re-export (unchanged) -----------------------

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          created_at: string
        }
      }
      ads: {
        Row: {
          id: string
          title: string
          description: string
          price: number | null
          category_id: string | null
          user_id: string | null
          images: string[] | null
          location: string | null
          condition: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description: string
          price?: number | null
          category_id?: string | null
          user_id?: string | null
          images?: string[] | null
          location?: string | null
          condition?: string | null
        }
        Update: {
          title?: string
          description?: string
          price?: number | null
          status?: string
        }
      }
      messages: {
        Row: {
          id: string
          ad_id: string | null
          sender_id: string | null
          receiver_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          ad_id: string
          sender_id: string
          receiver_id: string
          content: string
        }
      }
      call_requests: {
        Row: {
          id: string
          ad_id: string | null
          requester_id: string | null
          owner_id: string | null
          status: string
          message: string | null
          created_at: string
        }
        Insert: {
          ad_id: string
          requester_id: string
          owner_id: string
          message?: string | null
        }
        Update: {
          status: string
        }
      }
    }
  }
}
