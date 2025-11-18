import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)

  try {
    const code = requestUrl.searchParams.get("code")

    if (code) {
      const cookieStore = cookies()
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anon) {
        console.error("[v0] Auth callback missing Supabase envs")
        return NextResponse.redirect(new URL("/auth/login?error=callback_env", requestUrl.origin))
      }

      const supabase = createServerClient(url, anon, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      })

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error("[v0] Auth callback error:", error)
        return NextResponse.redirect(new URL("/auth/login?error=confirmation_failed", requestUrl.origin))
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user && user.email) {
          // Check if a profile exists with this email but different user ID
          // This happens when user signed up with email/password first, then uses Google OAuth
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("email", user.email.toLowerCase())
            .maybeSingle()

          // If profile exists with different ID, it means user has email/password account
          // Supabase creates a new OAuth account, but we want to use the existing one
          if (existingProfile && existingProfile.id !== user.id) {
            console.warn(`[v0] OAuth account created for existing email: ${user.email}`)
            // Note: Supabase creates separate accounts for email/password vs OAuth
            // The user will have two accounts. We'll use the OAuth account for now.
            // In the future, you might want to implement account linking.
            // For now, we'll proceed with the OAuth account and update the profile.
          }

          // Extract data from OAuth providers (Google, Facebook, etc.)
          const fullName =
            (user.user_metadata?.full_name as string | undefined) ||
            (user.user_metadata?.name as string | undefined) ||
            null
          const phone = (user.user_metadata?.phone as string | undefined) || null
          // Google OAuth provides 'picture', other providers may use 'avatar_url'
          const avatarUrl =
            (user.user_metadata?.avatar_url as string | undefined) ||
            (user.user_metadata?.picture as string | undefined) ||
            null
          
          // Upsert profile - if existing profile with different ID exists, 
          // this will create a new profile entry (Supabase allows this)
          // The user will have access via OAuth, but their email/password account remains separate
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email,
              full_name: fullName,
              phone: phone,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          )

          // Check if user is super admin and redirect accordingly
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

          const isSuperAdmin = profile?.role === "super_admin" || 
            user.email?.toLowerCase() === "ankit.koniyal000@gmail.com"
          
          const redirectPath = isSuperAdmin ? "/superadmin" : "/dashboard"
          return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
        }
      } catch (upsertErr) {
        console.warn("[v0] Profile ensure in callback failed:", (upsertErr as any)?.message)
      }
    }

    // Fallback: redirect to home if no code or user
    return NextResponse.redirect(new URL("/?confirmed=true", requestUrl.origin))
  } catch (error) {
    console.error("[v0] Auth callback exception:", error)
    return NextResponse.redirect(new URL("/auth/login?error=callback_error", requestUrl.origin))
  }
}
