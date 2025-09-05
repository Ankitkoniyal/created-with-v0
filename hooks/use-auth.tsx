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
  try {
    return await Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(onTimeoutValue), ms))])
  } catch (error) {
    console.log("[v0] Operation failed, returning timeout value:", error)
    return onTimeoutValue
  }
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
          try {
            const { data } = await s.auth.getSession()
            session = data?.session ?? session
          } catch (sessionError) {
            console.log("[v0] Session hydration failed (non-blocking):", sessionError)
            return
          }
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
      } catch (error) {
        console.log("[v0] Server session sync failed (non-blocking):", error)
      }
    }

    const initializeAuth = async () => {
      try {
        s = await getSupabaseClient()
        if (!s) {
          if (mounted) {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
          return
        }

        let session: any = null
        try {
          const { data: sessionData, error: sessionError } = await s.auth.getSession()

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

          session = sessionData?.session
        } catch (sessionFetchError) {
          console.log("[v0] Session fetch failed, treating as no session:", sessionFetchError)
          session = null
        }

        if (!mounted) return

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

          Promise.resolve().then(async () => {
            try {
              const profileData = await fetchProfile(session.user.id, session.user, s)
              if (!profileData) {
                await fetch("/api/profile/ensure", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  cache: "no-store",
                  body: JSON.stringify({}),
                })
                const retryProfileData = await fetchProfile(session.user.id, session.user, s)
                if (mounted) setProfile(retryProfileData)
              } else {
                if (mounted) setProfile(profileData)
              }
            } catch (profileError) {
              console.log("[v0] Profile fetch error (non-blocking):", profileError)
            }
          })
        } else {
          setUser(null)
          setProfile(null)
          if (mounted) setIsLoading(false)
        }
      } catch (error) {
        console.log("[v0] Auth initialization error:", error)
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
      try {
        s = await getSupabaseClient()
        if (!s) return

        const {
          data: { subscription },
        } = s.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return

          try {
            if (!session?.access_token || !session?.refresh_token) {
              try {
                const { data } = await s.auth.getSession()
                session = data?.session ?? session
              } catch (sessionError) {
                console.log("[v0] Session check failed in auth state change:", sessionError)
              }
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
              syncServerSession(event, session).catch(() => {})
            } else if (event === "SIGNED_OUT") {
              syncServerSession(event, null).catch(() => {})
            }

            if (event === "SIGNED_IN" && session?.user) {
              setUser(session.user)
              if (mounted) setIsLoading(false)

              Promise.allSettled([
                fetch("/api/profile/ensure", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  cache: "no-store",
                  body: JSON.stringify({}),
                }),
                fetchProfile(session.user.id, session.user, s),
              ]).then(([ensureResult, profileResult]) => {
                if (profileResult.status === "fulfilled" && mounted) {
                  setProfile(profileResult.value)
                }
              })
            } else if (event === "SIGNED_OUT") {
              setUser(null)
              setProfile(null)
              setIsLoading(false)
            } else if (event === "TOKEN_REFRESHED") {
              if (session?.user && mounted) setUser(session.user)
            }
          } catch (e) {
            console.log("[v0] Auth state change error:", e)
            await clearAllSessionData(s)
            if (mounted) {
              setUser(null)
              setProfile(null)
              setIsLoading(false)
            }
          }
        })
        unsubscribe = () => subscription.unsubscribe()
      } catch (subscriptionError) {
        console.log("[v0] Auth subscription setup failed:", subscriptionError)
      }
    })()

    return () => {
      mounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const s = await getSupabaseClient()
      if (!s) return { error: "Authentication is not configured. Please try again later." }

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
          Promise.allSettled([
            fetch("/api/auth/set", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: "SIGNED_IN",
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              }),
            }),
            fetch("/api/profile/ensure", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }),
          ]).then((results) => {
            results.forEach((result, index) => {
              if (result.status === "rejected") {
                console.log(`[v0] Background login operation ${index} failed:`, result.reason)
              }
            })
          })
        }

        return {}
      }

      return { error: "Login failed. Please try again." }
    } catch (err) {
      console.log("[v0] Login error:", err)
      return { error: "Network error. Please try again." }
    }
  }

  const signup = async (email: string, password: string, name: string, phone: string) => {
    try {
      const s = await getSupabaseClient()
      if (!s) return { error: "Authentication is not configured. Please try again later." }

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
    } catch (signupError) {
      console.log("[v0] Signup error:", signupError)
      setIsLoading(false)
      return { error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    try {
      const s = await getSupabaseClient()
      if (!s) return
      setIsLoading(true)

      Promise.allSettled([
        fetch("/api/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "SIGNED_OUT" }),
        }),
        s.auth.signOut(),
      ]).finally(() => {
        setIsLoading(false)
      })
    } catch (logoutError) {
      console.log("[v0] Logout error:", logoutError)
      setIsLoading(false)
    }
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
  } catch (profileError) {
    console.log("[v0] Profile fetch error:", profileError)
    return null
  }
}

const clearAllSessionData = async (s: any) => {
  try {
    await Promise.allSettled([
      withTimeout(
        fetch("/api/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "SIGNED_OUT" }),
        }),
        1200,
        undefined as any,
      ),
      withTimeout(s.auth.signOut(), 2000, undefined as any),
    ])

    if (typeof window !== "undefined") {
      try {
        const keys = Object.keys(localStorage)
        keys.forEach((key) => {
          if (key.includes("supabase") || key.includes("auth")) {
            localStorage.removeItem(key)
          }
        })
      } catch (storageError) {
        console.log("[v0] LocalStorage clear failed:", storageError)
      }
    }
  } catch (clearError) {
    console.log("[v0] Session clear error:", clearError)
  }
}
