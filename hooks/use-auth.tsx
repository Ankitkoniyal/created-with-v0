"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useRef } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type UserRole = 'user' | 'admin' | 'super_admin' | 'owner'

// ✅ UPDATED: Profile interface matches your actual table structure
interface Profile {
  id: string
  email: string // ✅ Your table has email column
  name: string
  phone?: string
  avatar_url?: string
  bio?: string
  location?: string
  created_at: string
  updated_at: string // ✅ Your table has updated_at
  role: UserRole
  email_notifications: boolean // ✅ Your table has these notification fields
  sms_notifications: boolean
  push_notifications: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string, name: string, phone: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)

  const isAdmin = !!(profile && (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'owner'))
  const isSuperAdmin = !!(profile && profile.role === 'super_admin')

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const fetchAndSetProfile = async () => {
      if (user) {
        const supabase = getSupabaseClient();
        if (!supabase) {
          if (mountedRef.current) {
            setProfile(null);
            setIsLoading(false);
          }
          return;
        }

        if (mountedRef.current) {
          setIsLoading(true);
        }

        const profileData = await fetchUserProfile(user.id, user, supabase);

        if (!profileData) {
          await ensureProfile();
          const retryProfileData = await fetchUserProfile(user.id, user, supabase);
          if (mountedRef.current) {
            setProfile(retryProfileData);
          }
        } else {
          if (mountedRef.current) {
            setProfile(profileData);
          }
        }

        if (mountedRef.current) {
          setIsLoading(false);
        }
      } else {
        if (mountedRef.current) {
          setProfile(null);
          setIsLoading(false);
        }
      }
    };

    fetchAndSetProfile();
  }, [user]);

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

  const syncServerSession = async (event: string, session: any | null) => {
    try {
      const response = await fetch("/api/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          access_token: session?.access_token || null,
          refresh_token: session?.refresh_token || null,
        }),
      })

      if (!response.ok) {
        console.warn(`Auth sync failed with status: ${response.status}`)
        return
      }

      const data = await response.json()
      if (!data.ok) {
        console.warn("Auth sync responded with error:", data.reason)
      }
    } catch (error) {
      console.log("[v0] Server session sync failed (non-blocking):", error)
    }
  }

  // ✅ UPDATED: Fixed profile fetching to match your actual table structure
  const fetchUserProfile = async (userId: string, userData: User, supabase: any): Promise<Profile | null> => {
    try {
      if (!supabase) return null
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error || !data) {
        console.log("[v0] Profile fetch error:", error)
        return null
      }

      // ✅ UPDATED: Match your actual table columns
      return {
        id: data.id,
        email: data.email || userData?.email || "", // Your table has email column
        name: data.full_name || userData?.email?.split("@")[0] || "User",
        phone: data.phone || "",
        avatar_url: data.avatar_url || "",
        bio: data.bio || "",
        location: data.location || "",
        created_at: data.created_at,
        updated_at: data.updated_at, // Your table has updated_at
        role: data.role || 'user',
        email_notifications: data.email_notifications ?? true,
        sms_notifications: data.sms_notifications ?? false,
        push_notifications: data.push_notifications ?? true
      }
    } catch (error) {
      console.log("[v0] Profile fetch error:", error)
      return null
    }
  }

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

    const initializeAuth = async () => {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          if (mountedRef.current) {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
          return
        }

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
          
          if (session.access_token && session.refresh_token) {
            await syncServerSession("SIGNED_IN", session)
          }
          
          if (mountedRef.current) {
            setUser(session.user);
          }
        } else {
          if (mountedRef.current) {
            setUser(null);
            setProfile(null);
            setIsLoading(false);
          }
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

    const setupAuthListener = () => {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) return

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mountedRef.current) return

          try {
            if (event === "TOKEN_REFRESHED" && (!session?.access_token || !session?.refresh_token)) {
              await clearAllSessionData(supabase)
              if (mountedRef.current) {
                setUser(null)
                setProfile(null)
                setIsLoading(false)
              }
              return
            }

            if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
                session?.access_token && session?.refresh_token) {
              await syncServerSession(event, session)
            } else if (event === "SIGNED_OUT") {
              await syncServerSession(event, null)
            }

            switch (event) {
              case "SIGNED_IN":
                if (session?.user) {
                  setUser(session.user)
                  if (mountedRef.current) setIsLoading(false)
                  
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

    initializeAuth().then(() => {
      setupAuthListener()
    })

    return () => {
      mountedRef.current = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return { error: "Authentication is not configured. Please try again later." }

      console.log("[v0] Login attempt for email:", email)

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

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
          await syncServerSession("SIGNED_IN", data.session)
          await ensureProfile()
          
          const profileData = await fetchUserProfile(data.session.user.id, data.session.user, supabase)
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
      const supabase = getSupabaseClient()
      if (!supabase) return { error: "Authentication is not configured. Please try again later." }

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
      const supabase = getSupabaseClient()
      if (!supabase) return
      
      setIsLoading(true)
      await clearAllSessionData(supabase)
      if (mountedRef.current) {
        setUser(null)
        setProfile(null)
      }
    } catch (logoutError) {
      console.log("[v0] Logout error:", logoutError)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      login, 
      signup, 
      logout, 
      isLoading,
      isAdmin,
      isSuperAdmin
    }}>
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
      isAdmin: false,
      isSuperAdmin: false
    }
  }
  
  return context
}
