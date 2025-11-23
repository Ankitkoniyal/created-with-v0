import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
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
          // For OAuth, phone should be NULL unless explicitly provided (Google doesn't provide phone)
          // Also filter out test/dummy phone numbers
          const rawPhone = (user.user_metadata?.phone as string | undefined) || null
          const phone = rawPhone && !['1234567890', '123456789', '0000000000', '1111111111'].includes(rawPhone)
            ? rawPhone
            : null
          // Google OAuth provides 'picture', other providers may use 'avatar_url'
          const avatarUrl =
            (user.user_metadata?.avatar_url as string | undefined) ||
            (user.user_metadata?.picture as string | undefined) ||
            null
          
          // Determine registration method from user identities
          // Use Supabase Admin API to get user identities (most reliable for OAuth)
          const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          
          let registrationMethod = 'email'
          if (supabaseUrl && serviceKey) {
            try {
              const adminClient = createClient(supabaseUrl, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false },
              })
              
              // Get user identities using Admin API
              const { data: userData, error: identityError } = await adminClient.auth.admin.getUserById(user.id)
              
              if (!identityError && userData?.user?.identities) {
                // Find OAuth provider (not email)
                const oauthIdentity = userData.user.identities.find((id: any) => id.provider !== 'email')
                if (oauthIdentity) {
                  const provider = oauthIdentity.provider
                  registrationMethod = provider === 'google' ? 'google' 
                    : provider === 'facebook' ? 'facebook'
                    : provider === 'apple' ? 'apple'
                    : provider === 'github' ? 'github'
                    : 'unknown'
                }
              }
            } catch (err) {
              console.warn("[v0] Failed to get user identities, defaulting to email:", err)
              // Default to 'email' if check fails
            }
          }
          
          // Check if profile already exists to determine if this is a new signup
          // Also check if user was just created (within last 5 minutes) to catch email confirmations
          const { data: existingProfileById } = await supabase
            .from("profiles")
            .select("id, created_at")
            .eq("id", user.id)
            .maybeSingle()

          // Check if user was created recently (within last 5 minutes) - indicates new signup
          const userCreatedAt = user.created_at ? new Date(user.created_at).getTime() : 0
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
          const isRecentlyCreated = userCreatedAt > fiveMinutesAgo
          
          const isNewSignup = !existingProfileById || isRecentlyCreated
          
          // Upsert profile - if existing profile with different ID exists, 
          // this will create a new profile entry (Supabase allows this)
          // The user will have access via OAuth, but their email/password account remains separate
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email,
              full_name: fullName,
              phone: phone, // NULL for OAuth signups
              avatar_url: avatarUrl,
              registration_method: registrationMethod,
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
          const redirectUrl = new URL(redirectPath, requestUrl.origin)
          
          // Add welcome parameter for new signups
          if (isNewSignup) {
            redirectUrl.searchParams.set("welcome", "true")
            
            // Send welcome email if email notifications are enabled
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("email_notifications")
                .eq("id", user.id)
                .single()
              
              if (user.email && profile?.email_notifications !== false) {
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin
                await fetch(`${siteUrl}/api/notifications/email`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    to: user.email,
                    type: "welcome",
                    data: {
                      userName: fullName || user.email.split("@")[0],
                    },
                  }),
                }).catch((err) => {
                  console.warn("Failed to send welcome email:", err)
                  // Don't fail the signup if email fails
                })
              }
            } catch (emailError) {
              console.warn("Welcome email error:", emailError)
              // Don't fail the signup if email fails
            }
          }
          
          return NextResponse.redirect(redirectUrl)
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
