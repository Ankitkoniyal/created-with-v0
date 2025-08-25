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
        name: data.full_name || userData?.email?.split("@")[0] || "User",
        email: data.email || userData?.email || "",
        phone: data.phone || "",
        avatar_url: data.avatar_url || "",
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
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("[v0] Starting auth initialization...")

        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("[v0] Session check result:", session ? "Session found" : "No session found")

        if (!mounted) return

        if (session?.user) {
          console.log("[v0] User found in session:", session.user.email)
          setUser(session.user)

          try {
            console.log("[v0] Fetching profile for user:", session.user.id)
            const profileData = await fetchProfile(session.user.id, session.user)
            if (mounted) {
              console.log("[v0] Profile fetched successfully:", profileData.name)
              setProfile(profileData)
            }
          } catch (profileError) {
            console.log("[v0] Profile fetch error:", profileError)
            if (mounted) {
              setProfile(null)
            }
          }
        } else {
          console.log("[v0] No user in session, setting user to null")
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

      if (event === "SIGNED_IN" && session?.user) {
        console.log("[v0] User signed in:", session.user.email)
        setUser(session.user)
        try {
          const profileData = await fetchProfile(session.user.id, session.user)
          if (mounted) {
            console.log("[v0] Profile loaded after sign in:", profileData.name)
            setProfile(profileData)
          }
        } catch (profileError) {
          console.log("[v0] Profile fetch error after sign in:", profileError)
          if (mounted) {
            setProfile(null)
          }
        }
        setIsLoading(false)
      } else if (event === "SIGNED_OUT") {
        console.log("[v0] User signed out")
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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

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
    } catch (error) {
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
