"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useRef } from "react"
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)

  // ✅ FIX: Use ref for mount status to prevent memory leaks
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const ensureProfile = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/profile/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.ok) {
        console.log("[v0] Profile ensure soft failure:", result.reason)
        return false
      }
      
      console.log("[v0] Profile ensure successful")
      return true
    } catch (error) {
      console.log("[v0] Profile ensure failed (non-blocking):", error)
      return false
    }
  }

  // ✅ FIX: Extract session sync to separate function
  const syncServerSession = async (event: string, session: any | null) => {
    try {
      await fetch("/api/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          access_token: session?.access_token || null,
          refresh_token: session?.refresh_token || null,
        }),
      })
    } catch (error) {
      console.log("[v0] Server session sync failed (non-blocking):", error)
    }
  }

  // ✅ FIX: Extract profile fetching logic
  const fetchUserProfile = async (userId: string, userData: User, supabase: any): Promise<Profile | null> => {
    try {
      if (!supabase) return null
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error || !data) return null

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
      console.log("[v0] Profile fetch error:", error)
      return null
    }
  }

  // ✅ FIX: Extract session clearing logic
  const clearAllSessionData = async (supabase: any) => {
    try {
      await Promise.allSettled([
        fetch("/api/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "SIGNED_OUT" }),
        }),
        supabase.auth.signOut(),
      ])

      // Clear localStorage safely
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
    } catch (error) {
      console.log("[v0] Session clear error:", error)
    }
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let supabase: any = null

    const initializeAuth = async () => {
      try {
        supabase = await getSupabaseClient()
        if (!supabase) {
          if (mountedRef.current) {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
          return
        }

        // Get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          if (sessionError.message?.includes("refresh_token_not_found") ||
              sessionError.message?.includes("Invalid Refresh Token")) {
            await clearAllSessionData(supabase)
            if (mountedRef.current) {
              setUser(null)
              setProfile(null)
              setIsLoading(false)
            }
            return
          }
          throw sessionError
        }

        const session = sessionData?.session

        if (!mountedRef.current) return

        // Validate session
        if (session?.user && (!session?.access_token || !session?.refresh_token)) {
          await clearAllSessionData(supabase)
          if (mountedRef.current) {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
          return
        }

        if (session?.user) {
          console.log("[v0] Found existing session for user:", session.user.email)
          
          // Sync session with server
          if (session.access_token && session.refresh_token) {
            await syncServerSession("SIGNED_IN", session)
          }
          
          setUser(session.user)

          if (mountedRef.current) setIsLoading(false)

          // ✅ FIX: Sequential profile handling to avoid race conditions
          const profileData = await fetchUserProfile(session.user.id, session.user, supabase)
          if (!profileData) {
            await ensureProfile()
            const retryProfileData = await fetchUserProfile(session.user.id, session.user, supabase)
            if (mountedRef.current) setProfile(retryProfileData)
          } else {
            if (mountedRef.current) setProfile(profileData)
          }
        } else {
          setUser(null)
          setProfile(null)
          if (mountedRef.current) setIsLoading(false)
        }
      } catch (error) {
        console.log("[v0] Auth initialization error:", error)
        if (mountedRef.current) {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      }
    }

    // Set up auth state listener
    const setupAuthListener = async () => {
      try {
        supabase = await getSupabaseClient()
        if (!supabase) return

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mountedRef.current) return

          try {
            // Handle token refresh issues
            if (event === "TOKEN_REFRESHED" && (!session?.access_token || !session?.refresh_token)) {
              await clearAllSessionData(supabase)
              if (mountedRef.current) {
                setUser(null)
                setProfile(null)
                setIsLoading(false)
              }
              return
            }

            // Sync with server
            if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
                session?.access_token && session?.refresh_token) {
              await syncServerSession(event, session)
            } else if (event === "SIGNED_OUT") {
              await syncServerSession(event, null)
            }

            // Update state based on event
            switch (event) {
              case "SIGNED_IN":
                if (session?.user) {
                  setUser(session.user)
                  if (mountedRef.current) setIsLoading(false)
                  
                  // ✅ FIX: Sequential profile handling
                  await ensureProfile()
                  const profileData = await fetchUserProfile(session.user.id, session.user, supabase)
                  if (mountedRef.current) setProfile(profileData)
                }
                break
                
              case "SIGNED_OUT":
                setUser(null)
                setProfile(null)
                setIsLoading(false)
                break
                
              case "TOKEN_REFRESHED":
                if (session?.user && mountedRef.current) setUser(session.user)
                break
            }
          } catch (error) {
            console.log("[v0] Auth state change error:", error)
            await clearAllSessionData(supabase)
            if (mountedRef.current) {
              setUser(null)
              setProfile(null)
              setIsLoading(false)
            }
          }
        })

        unsubscribe = () => subscription.unsubscribe()
      } catch (error) {
        console.log("[v0] Auth subscription setup failed:", error)
      }
    }

    // Initialize auth
    initializeAuth().then(() => {
      // Set up listener after initialization
      setupAuthListener()
    })

    return () => {
      mountedRef.current = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, []) // ✅ Empty deps array is correct for mount-only

  // ... rest of your functions (login, signup, logout) remain mostly the same
  // but can be optimized with the extracted helper functions

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
          // ✅ FIX: Use extracted functions
          await syncServerSession("SIGNED_IN", data.session)
          await ensureProfile() // Wait for profile creation
          
          const profileData = await fetchUserProfile(data.session.user.id, data.session.user, s)
          if (mountedRef.current) setProfile(profileData)
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
      
      setIsLoading(false)
      
      if (error) {
        return { error: error.message }
      }
      
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
      await clearAllSessionData(s)
    } catch (logoutError) {
      console.log("[v0] Logout error:", logoutError)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
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
