"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
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

const withTimeout = async <T,>(p: Promise<T>, ms: number, onTimeoutValue: T): Promise<T> => {
  return await Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(onTimeoutValue), ms))])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let s: any

    const syncServerSession = async (event: string, session: any | null) => {
      try {
        if (!s) return
        // If session is missing tokens, try to hydrate once
        if (!session?.access_token || !session?.refresh_token) {
          const { data } = await s.auth.getSession()
          session = data?.session ?? session
        }
        if (
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
          (!session?.access_token || !session?.refresh_token)
        ) {
          return
        }
        await withTimeout(
          fetch("/api/auth/set", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              event,
              access_token: session?.access_token || null,
              refresh_token: session?.refresh_token || null,
            }),
          }),
          1200,
          undefined as any,
        )
      } catch {
        // swallow to avoid breaking UI
      }
    }

    const initializeAuth = async () => {
      s = await getSupabaseClient()
      if (!s) {
        if (mounted) {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
        return
      }
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

        if (session?.user && (!session?.access_token || !session?.refresh_token)) {
          await clearAllSessionData(s)
          if (mounted) {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
          return
        }

        if (session?.user) {
          console.log("[v0] Found existing session for user:", session.user.email)
          if (session.access_token && session.refresh_token) {
            syncServerSession("SIGNED_IN", session).catch(() => {})
          }
          setUser(session.user)

          if (mounted) setIsLoading(false)

          try {
            const profileData = await fetchProfile(session.user.id, session.user, s)
            if (!profileData) {
              fetch("/api/profile/ensure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
                body: JSON.stringify({}),
              })
                .then(() => {
                  return fetchProfile(session.user.id, session.user, s)
                })
                .then((data) => {
                  if (mounted) setProfile(data)
                })
                .catch(() => {})
            } else {
              if (mounted) setProfile(profileData)
            }
          } catch (profileError) {
            console.error("Profile fetch error:", profileError)
          }
        } else {
          setUser(null)
          setProfile(null)
          if (mounted) setIsLoading(false)
        }
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

    let unsubscribe: (() => void) | undefined
    ;(async () => {
      s = await getSupabaseClient()
      if (!s) return
      const {
        data: { subscription },
      } = s.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return

        try {
          if (!session?.access_token || !session?.refresh_token) {
            const { data } = await s.auth.getSession()
            session = data?.session ?? session
          }

          if (event === "TOKEN_REFRESHED" && (!session?.access_token || !session?.refresh_token)) {
            await clearAllSessionData(s)
            if (mounted) {
              setUser(null)
              setProfile(null)
              setIsLoading(false)
            }
            return
          }

          if (
            (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
            session?.access_token &&
            session?.refresh_token
          ) {
            await syncServerSession(event, session)
          } else if (event === "SIGNED_OUT") {
            await syncServerSession(event, null)
          }

          if (event === "SIGNED_IN" && session?.user) {
            setUser(session.user)

            if (mounted) setIsLoading(false)

            try {
              await withTimeout(
                fetch("/api/profile/ensure", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  cache: "no-store",
                  body: JSON.stringify({}),
                }),
                1500,
                undefined as any,
              )
              const profileData = await fetchProfile(session.user.id, session.user, s)
              if (mounted) setProfile(profileData)
            } catch (profileError) {
              console.error("Profile fetch error after sign in:", profileError)
            }
            // was: setIsLoading(false) here; moved earlier to avoid blocking UI
          } else if (event === "SIGNED_OUT") {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          } else if (event === "TOKEN_REFRESHED") {
            if (session?.user && mounted) setUser(session.user)
          }
        } catch (e) {
          await clearAllSessionData(s)
          if (mounted) {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
        }
      })
      unsubscribe = () => subscription.unsubscribe()
    })()

    return () => {
      mounted = false
      if (unsubscribe) unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const s = await getSupabaseClient()
    if (!s) return { error: "Authentication is not configured. Please try again later." }

    try {
      console.log("[v0] Login attempt for email:", email)

      const { data, error } = await s.auth.signInWithPassword({ email, password })

      if (error) {
        const msg = String(error.message || "")
        if (/invalid login credentials/i.test(msg)) {
          return { error: "Invalid email or password. Please check your credentials and try again." }
        } else if (/email not confirmed/i.test(msg)) {
          return { error: "Please check your email and click the confirmation link before signing in." }
        } else if (/too many/i.test(msg) || /rate/i.test(msg)) {
          return { error: "Too many login attempts. Please wait a few minutes before trying again." }
        }
        return { error: msg || "Login failed. Please try again." }
      }

      if (data.session?.user) {
        setUser(data.session.user)

        if (data.session.access_token && data.session.refresh_token) {
          fetch("/api/auth/set", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "SIGNED_IN",
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          }).catch(() => {})

          fetch("/api/profile/ensure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }).catch(() => {})
        }

        return {}
      }

      return { error: "Login failed. Please try again." }
    } catch (err) {
      console.error("Login error:", err)
      return { error: "Network error. Please try again." }
    }
  }

  const signup = async (email: string, password: string, name: string, phone: string) => {
    const s = await getSupabaseClient()
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
      setIsLoading(false)
      return {}
    } catch {
      setIsLoading(false)
      return { error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    const s = await getSupabaseClient()
    if (!s) return
    setIsLoading(true)
    try {
      await fetch("/api/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "SIGNED_OUT" }),
      })
    } catch {}
    await s.auth.signOut()
    setIsLoading(false)
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

const fetchProfile = async (userId: string, userData: User, s: any): Promise<Profile | null> => {
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

const clearAllSessionData = async (s: any) => {
  try {
    await withTimeout(
      fetch("/api/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "SIGNED_OUT" }),
      }),
      1200,
      undefined as any,
    )
  } catch {}

  await withTimeout(s.auth.signOut(), 2000, undefined as any)

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
