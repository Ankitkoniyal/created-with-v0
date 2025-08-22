"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
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

  useEffect(() => {
    console.log("[v0] AuthProvider state changed - user:", !!user, "profile:", !!profile, "isLoading:", isLoading)
  }, [user, profile, isLoading])

  const fetchProfile = useCallback(
    async (userId: string, userData: User) => {
      try {
        console.log("[v0] Fetching profile for user:", userId)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()
          .abortSignal(controller.signal)

        clearTimeout(timeoutId)

        if (error) {
          console.error("[v0] Error fetching profile:", error)
          console.log("[v0] Creating fallback profile from user metadata")
          setProfile({
            id: userId,
            name:
              userData?.user_metadata?.full_name ||
              userData?.user_metadata?.name ||
              userData?.email?.split("@")[0] ||
              "User",
            email: userData?.email || "",
            phone: userData?.user_metadata?.phone || "",
            avatar_url: userData?.user_metadata?.avatar_url || "",
            bio: "",
            location: "",
            verified: false,
            created_at: new Date().toISOString(),
          })
          return
        }

        console.log("[v0] Profile fetched successfully:", data)
        setProfile({
          id: data.id,
          name: data.full_name || data.name || userData?.email?.split("@")[0] || "User",
          email: data.email || userData?.email || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
          location: data.location || "",
          verified: data.verified || false,
          created_at: data.created_at,
        })
      } catch (error) {
        console.error("[v0] Network error fetching profile:", error)
        console.log("[v0] Creating fallback profile due to network error")
        setProfile({
          id: userId,
          name:
            userData?.user_metadata?.full_name ||
            userData?.user_metadata?.name ||
            userData?.email?.split("@")[0] ||
            "User",
          email: userData?.email || "",
          phone: userData?.user_metadata?.phone || "",
          avatar_url: userData?.user_metadata?.avatar_url || "",
          bio: "",
          location: "",
          verified: false,
          created_at: new Date().toISOString(),
        })
      }
    },
    [supabase],
  )

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      console.log("[v0] Getting initial session...")
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      console.log("[v0] Initial session:", !!session?.user)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id, session.user)
      }
      console.log("[v0] Setting isLoading to false after initial session")
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("[v0] Auth state changed:", event, "user:", !!session?.user)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id, session.user)
      } else {
        setProfile(null)
      }
      console.log("[v0] Setting isLoading to false after auth state change")
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  }

  const signup = async (email: string, password: string, name: string, phone: string) => {
    try {
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
            name,
            phone,
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    console.log("[v0] Logging out user")
    setIsLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setIsLoading(false)
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
