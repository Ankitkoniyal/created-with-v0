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

  const fetchProfile = async (userId: string, userData: User): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        const newProfile = {
          id: userId,
          full_name: userData?.user_metadata?.full_name || userData?.email?.split("@")[0] || "User",
          email: userData?.email || "",
          phone: userData?.user_metadata?.phone || "",
          avatar_url: userData?.user_metadata?.avatar_url || "",
          bio: "",
          location: "",
          verified: false,
        }

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single()

        if (createError) {
          console.error("Failed to create profile:", createError)
          return null
        }

        return {
          id: createdProfile.id,
          name: createdProfile.full_name || "User",
          email: createdProfile.email || "",
          phone: createdProfile.phone || "",
          avatar_url: createdProfile.avatar_url || "",
          bio: createdProfile.bio || "",
          location: createdProfile.location || "",
          verified: createdProfile.verified || false,
          created_at: createdProfile.created_at,
        }
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
    } catch (error) {
      console.error("Profile fetch error:", error)
      return null
    }
  }

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
          const profileData = await fetchProfile(session.user.id, session.user)
          if (mounted) {
            setProfile(profileData)
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        const profileData = await fetchProfile(session.user.id, session.user)
        if (mounted) {
          setProfile(profileData)
        }
        setIsLoading(false)
      } else if (event === "SIGNED_OUT") {
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
