"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  name: string
  email: string
  phone?: string
  avatar_url?: string
  bio?: string
  location?: string
  verified: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string, name: string, phone: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Create a fresh client inside effect (ensures window.__supabase is available)
    const s = createClient()
    if (!s) {
      setIsLoading(false)
      return
    }

    const syncServerSession = async (event: string, session: any | null) => {
      try {
        // If session is missing tokens, try to hydrate once
        if (!session?.access_token || !session?.refresh_token) {
          const { data } = await s.auth.getSession()
          session = data?.session ?? session
        }

        // Guard: do NOT post unless we have both tokens for setSession to succeed
        if (
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
          (!session?.access_token || !session?.refresh_token)
        ) {
          return
        }

        await fetch("/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            event,
            access_token: session?.access_token || null,
            refresh_token: session?.refresh_token || null,
          }),
        })
      } catch {
        // swallow to avoid breaking UI
      }
    }

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await s.auth.getSession()

        if (!mounted) return

        if (sessionError) {
          if (
            sessionError.message?.includes("refresh_token_not_found") ||
            sessionError.message?.includes("Invalid Refresh Token")
          ) {
            await clearAllSessionData(s)
            if (mounted) {
              setUser(null)
              setProfile(null)
              setIsLoading(false)
            }
            return
          }
          throw sessionError
        }

        if (session?.user) {
          console.log("[v0] Found existing session for user:", session.user.email)
          if (session.access_token && session.refresh_token) {
            await syncServerSession("SIGNED_IN", session)
          }
          setUser(session.user)
          try {
            const profileData = await fetchProfile(session.user.id, session.user, s)
            if (!profileData) {
              console.log("[v0] Profile not found for user:", session.user.email, "- clearing all session data")
              await clearAllSessionData(s)
              if (mounted) {
                setUser(null)
                setProfile(null)
                setIsLoading(false)
              }
              return
            }
            if (mounted) setProfile(profileData)
          } catch (profileError) {
            console.error("Profile fetch error:", profileError)
            await clearAllSessionData(s)
            if (mounted) {
              setUser(null)
              setProfile(null)
            }
          }
        } else {
          setUser(null)
          setProfile(null)
        }

        if (mounted) setIsLoading(false)
      } catch (error) {
        console.error("Auth initialization error:", error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = s.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (!session?.access_token || !session?.refresh_token) {
        const { data } = await s.auth.getSession()
        session = data?.session ?? session
      }

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.access_token && session?.refresh_token) {
        await syncServerSession(event, session)
      } else if (event === "SIGNED_OUT") {
        await syncServerSession(event, null)
      }

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        try {
          const profileData = await fetchProfile(session.user.id, session.user, s)
          if (!profileData) {
            console.log("[v0] User authenticated but profile missing - user was deleted from database")
            await clearAllSessionData(s)
            if (mounted) {
              setUser(null)
              setProfile(null)
              setIsLoading(false)
            }
            return
          }
          if (mounted) setProfile(profileData)
        } catch (profileError) {
          console.error("Profile fetch error after sign in:", profileError)
          await clearAllSessionData(s)
          if (mounted) {
            setUser(null)
            setProfile(null)
          }
        }
        setIsLoading(false)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      } else if (event === "TOKEN_REFRESHED") {
        if (session?.user && mounted) setUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const s = createClient()
    if (!s) return { error: "Authentication is not configured. Please try again later." }
    try {
      setIsLoading(true)
      console.log("[v0] Login attempt for email:", email)
      const { data, error } = await s.auth.signInWithPassword({ email, password })
      if (error) {
        setIsLoading(false)
        if (error.message.includes("Invalid login credentials")) {
          return { error: "Invalid email or password. Please check your credentials and try again." }
        } else if (error.message.includes("Email not confirmed")) {
          return { error: "Please check your email and click the confirmation link before signing in." }
        } else if (error.message.includes("Too many requests")) {
          return { error: "Too many login attempts. Please wait a few minutes before trying again." }
        }
        return { error: error.message }
      }

      let sess = data?.session || null
      if (!sess?.access_token || !sess?.refresh_token) {
        const { data: gs } = await s.auth.getSession()
        if (gs?.session) sess = gs.session
      }

      if (sess?.user) {
        try {
          const { data: profileData, error: profileError } = await s
            .from("profiles")
            .select("*")
            .eq("id", sess.user.id)
            .single()

          if (profileError || !profileData) {
            // User exists in auth but not in profiles table - they were deleted from database
            console.log("[v0] User authenticated but profile missing - user was deleted from database")
            await clearAllSessionData(s)
            setIsLoading(false)
            return {
              error: "This account has been deactivated. Please contact support if you believe this is an error.",
            }
          }
        } catch (profileCheckError) {
          console.error("[v0] Profile check failed:", profileCheckError)
          await clearAllSessionData(s)
          setIsLoading(false)
          return {
            error: "Unable to verify account status. Please try again later.",
          }
        }
      }

      if (sess?.access_token && sess?.refresh_token) {
        try {
          await fetch("/auth/set", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              event: "SIGNED_IN",
              access_token: sess.access_token,
              refresh_token: sess.refresh_token,
            }),
          })
        } catch {
          // ignore; onAuthStateChange will also sync as a backup
        }
      }

      if (sess?.user) setUser(sess.user)
      setIsLoading(false)
      return {}
    } catch {
      setIsLoading(false)
      return { error: "Network error: Unable to connect to authentication service" }
    }
  }

  const signup = async (email: string, password: string, name: string, phone: string) => {
    const s = createClient()
    if (!s) return { error: "Authentication is not configured. Please try again later." }
    try {
      setIsLoading(true)
      const redirectUrl =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "http://localhost:3000/auth/callback")

      const { error } = await s.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: name, phone },
        },
      })
      if (error) {
        setIsLoading(false)
        return { error: error.message }
      }
      return {}
    } catch {
      setIsLoading(false)
      return { error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    const s = createClient()
    if (!s) return
    setIsLoading(true)
    try {
      await fetch("/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "SIGNED_OUT" }),
      })
    } catch {}
    await s.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    return {
      user: null,
      profile: null,
      login: async () => ({ error: "Authentication is not available right now. Please try again later." }),
      signup: async () => ({ error: "Authentication is not available right now. Please try again later." }),
      logout: async () => {},
      isLoading: false,
    }
  }
  return context
}

const fetchProfile = async (userId: string, userData: User, s = createClient()): Promise<Profile | null> => {
  try {
    if (!s) {
      return null
    }
    const { data, error } = await s.from("profiles").select("*").eq("id", userId).single()
    if (error || !data) {
      return null
    }
    return {
      id: data.id,
      name: data.full_name || userData?.email?.split("@")[0] || "User",
      email: data.email || userData?.email || "",
      phone: data.phone || "",
      avatar_url: data.avatar_url || "",
      bio: data.bio || "",
      location: data.location || "",
      verified: data.verified || false,
      created_at: data.created_at,
    }
  } catch {
    return null
  }
}

// Helper function to clear all session data
const clearAllSessionData = async (s: any) => {
  try {
    // Clear server-side cookies
    await fetch("/auth/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ event: "SIGNED_OUT" }),
    })
  } catch {}

  // Sign out from Supabase (clears localStorage)
  await s.auth.signOut()

  // Clear any remaining localStorage items
  if (typeof window !== "undefined") {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.includes("supabase") || key.includes("auth")) {
          localStorage.removeItem(key)
        }
      })
    } catch {}
  }
}
