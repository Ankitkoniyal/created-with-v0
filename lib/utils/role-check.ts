// File: lib/utils/role-check.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return false
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookies().set(name, value, options)
      },
      remove(name: string, options: any) {
        cookies().set(name, '', { ...options, maxAge: 0 })
      },
    },
  })

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return false
  }

  return profile.role === 'superadmin'
}