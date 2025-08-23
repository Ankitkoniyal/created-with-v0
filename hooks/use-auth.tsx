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
  const supabase = createClient()

  const fetchProfile = async (userId: string, userData: User): Promise<Profile> => {
    try {
      console.log("[v0] Fetching profile for user:", userId)
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.log("[v0] Profile not found, creating fallback profile:", error.message)

        // Return fallback profile immediately instead of trying to insert
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

        console.log("[v0] Using fallback profile:", fallbackProfile)
        return fallbackProfile
      }

      // Return actual profile data
      const profileData = {
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

      console.log("[v0] Successfully fetched profile:", profileData)
      return profileData
    } catch (error) {
      console.log("[v0] Profile fetch error:", error)
      // Return fallback profile on error
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

      console.log("[v0] Using fallback profile after error:", fallbackProfile)
      return fallbackProfile
    }
  }

  const testSupabaseConnection = async () => {
    try {
      console.log("[v0] Testing Supabase connection...")
      console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)

      // Simple health check
      const { data, error } = await supabase.from("profiles").select("count").limit(1)

      if (error) {
        console.log("[v0] Supabase connection test failed:", error.message)
        return false
      }

      console.log("[v0] Supabase connection test successful")
      return true
    } catch (error) {
      console.log("[v0] Supabase connection test error:", error)
      return false
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("[v0] Starting auth initialization...")

        const connectionOk = await testSupabaseConnection()
        if (!connectionOk) {
          console.log("[v0] Supabase connection failed, skipping auth initialization")
          if (mounted) {
            setIsLoading(false)
          }
          return
        }

        console.log("[v0] Getting session...")
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          console.log("[v0] Session found, setting user and fetching profile...")
          setUser(session.user)

          const profilePromise = fetchProfile(session.user.id, session.user)
          const timeoutPromise = new Promise<Profile>((_, reject) =>
            setTimeout(() => reject(new Error("Profile fetch timeout")), 10000),
          )

          try {
            const profileData = await Promise.race([profilePromise, timeoutPromise])
            if (mounted) {
              setProfile(profileData)
              console.log("[v0] Profile set successfully")
            }
          } catch (profileError) {
            console.log("[v0] Profile fetch failed or timed out:", profileError)
            // Continue with null profile instead of hanging
            if (mounted) {
              setProfile(null)
            }
          }
        } else {
          console.log("[v0] No session found")
          setUser(null)
          setProfile(null)
        }

        if (mounted) {
          console.log("[v0] Auth initialization complete, setting loading to false")
          setIsLoading(false)
        }
      } catch (error) {
        console.log("[v0] Auth initialization error:", error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state change:", event)
      if (!mounted) return

      if (session?.user) {
        console.log("[v0] Auth state change: user logged in")
        setUser(session.user)

        try {
          const profilePromise = fetchProfile(session.user.id, session.user)
          const timeoutPromise = new Promise<Profile>((_, reject) =>
            setTimeout(() => reject(new Error("Profile fetch timeout")), 10000),
          )

          const profileData = await Promise.race([profilePromise, timeoutPromise])
          if (mounted) {
            setProfile(profileData)
            setIsLoading(false)
          }
        } catch (profileError) {
          console.log("[v0] Profile fetch failed in auth state change:", profileError)
          if (mounted) {
            setProfile(null)
            setIsLoading(false)
          }
        }
      } else {
        console.log("[v0] Auth state change: user logged out")
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      console.log("[v0] Testing connection before login...")
      const connectionOk = await testSupabaseConnection()
      if (!connectionOk) {
        setIsLoading(false)
        return {
          error: "Unable to connect to authentication service. Please check your internet connection and try again.",
        }
      }

      console.log("[v0] Attempting login for:", email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log("[v0] Login error:", error.message)
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

      console.log("[v0] Login successful")
      return {}
    } catch (error) {
      console.log("[v0] Login catch error:", error)
      setIsLoading(false)
      return { error: "Network error: Unable to connect to authentication service" }
    }
  }

  const signup = async (email: string, password: string, name: string, phone: string) => {
    try {
      setIsLoading(true)
      const redirectUrl =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "http://localhost:3000/auth/callback")

      const { error } = await supabase.auth.signUp({
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

      if (error) {
        setIsLoading(false)
        return { error: error.message }
      }

      return {}
    } catch (error) {
      setIsLoading(false)
      return { error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    // State will be updated by the auth state change listener
  }

  return (
    <AuthContext.Provider value={{ user, profile, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
