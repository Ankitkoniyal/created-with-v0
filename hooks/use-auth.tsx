"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
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

  const supabase = useMemo(() => createClient(), [])

  const fetchProfile = useCallback(
    async (userId: string, userData: User): Promise<Profile> => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

        if (error) {
          const fallbackProfile = {
            id: userId,
            name: userData?.user_metadata?.full_name || userData?.email?.split("@")[0] || "User",
            email: userData?.email || "",
            phone: userData?.user_metadata?.phone || "",
            avatar_url: userData?.user_metadata?.avatar_url || "",
            bio: "",
            location: "",
            verified: false,
            created_at: new Date().toISOString(),
          }

          return fallbackProfile
        }

        const profileData = {
          id: data.id,
          name: data.full_name || userData?.user_metadata?.full_name || userData?.email?.split("@")[0] || "User",
          email: data.email || userData?.email || "",
          phone: data.phone || userData?.user_metadata?.phone || "",
          avatar_url: data.avatar_url || userData?.user_metadata?.avatar_url || "",
          bio: data.bio || "",
          location: data.location || "",
          verified: data.verified || false,
          created_at: data.created_at,
        }

        return profileData
      } catch (error) {
        const fallbackProfile = {
          id: userId,
          name: userData?.user_metadata?.full_name || userData?.email?.split("@")[0] || "User",
          email: userData?.email || "",
          phone: userData?.user_metadata?.phone || "",
          avatar_url: userData?.user_metadata?.avatar_url || "",
          bio: "",
          location: "",
          verified: false,
          created_at: new Date().toISOString(),
        }

        return fallbackProfile
      }
    },
    [supabase],
  )

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 3

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          if (mounted) {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
          return
        }

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)

          try {
            const profileData = await fetchProfile(session.user.id, session.user)
            if (mounted) {
              setProfile(profileData)
            }
          } catch (profileError) {
            console.error("Profile fetch error:", profileError)
            if (mounted) {
              setProfile(null)
            }
          }
        } else {
          setUser(null)
          setProfile(null)
        }

        if (mounted) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)

        if (retryCount < maxRetries && mounted) {
          retryCount++
          setTimeout(() => {
            if (mounted) {
              initializeAuth()
            }
          }, 1000 * retryCount) // Exponential backoff
        } else if (mounted) {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        try {
          const profileData = await fetchProfile(session.user.id, session.user)
          if (mounted) {
            setProfile(profileData)
          }
        } catch (profileError) {
          console.error("Profile fetch error after sign in:", profileError)
          if (mounted) {
            setProfile(null)
          }
        }
        if (mounted) {
          setIsLoading(false)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        if (mounted) {
          setIsLoading(false)
        }
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user)
        if (mounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true)

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Login timeout")), 15000))

        const loginPromise = supabase.auth.signInWithPassword({
          email,
          password,
        })

        const { error } = (await Promise.race([loginPromise, timeoutPromise])) as any

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

        return {}
      } catch (error: any) {
        setIsLoading(false)

        if (error.message === "Login timeout") {
          return { error: "Login is taking too long. Please check your connection and try again." }
        }

        return { error: "Network error: Unable to connect to authentication service" }
      }
    },
    [supabase],
  )

  const signup = useCallback(
    async (email: string, password: string, name: string, phone: string) => {
      try {
        setIsLoading(true)
        const redirectUrl =
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          (typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : "http://localhost:3000/auth/callback")

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Signup timeout")), 15000))

        const signupPromise = supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: name,
              phone,
            },
          },
        })

        const { error } = (await Promise.race([signupPromise, timeoutPromise])) as any

        if (error) {
          setIsLoading(false)
          return { error: error.message }
        }

        return {}
      } catch (error: any) {
        setIsLoading(false)

        if (error.message === "Signup timeout") {
          return { error: "Signup is taking too long. Please check your connection and try again." }
        }

        return { error: "An unexpected error occurred" }
      }
    },
    [supabase],
  )

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Logout timeout")), 10000)),
      ])
    } catch (error) {
      console.error("Logout error:", error)
      // Force logout on client side even if server request fails
      setUser(null)
      setProfile(null)
      setIsLoading(false)
    }
    // State will be updated by the auth state change listener
  }, [supabase])

  const contextValue = useMemo(
    () => ({
      user,
      profile,
      login,
      signup,
      logout,
      isLoading,
    }),
    [user, profile, login, signup, logout, isLoading],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
