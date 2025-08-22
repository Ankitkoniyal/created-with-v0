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

  const fetchProfile = useCallback(
    async (userId: string, userData: User) => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

        if (error) {
          // Create fallback profile from user metadata
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
          setProfile(fallbackProfile)
          return
        }

        // Map database fields to profile interface
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
        setProfile(profileData)
      } catch (error) {
        // Create fallback profile on network error
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
        setProfile(fallbackProfile)
      }
    },
    [supabase],
  )

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user)
        } else {
          setUser(null)
          setProfile(null)
        }
        setIsLoading(false)
      } catch (error) {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id, session.user)
      } else {
        setUser(null)
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

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
            full_name: name,
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
