"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"

type UserRole = "user" | "admin" | "super_admin" | "owner"

interface Profile {
  id: string
  email?: string
  name?: string
  phone?: string
  avatar_url?: string
  bio?: string
  location?: string
  created_at?: string
  updated_at?: string
  role?: UserRole
  email_notifications?: boolean
  sms_notifications?: boolean
  push_notifications?: boolean
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  login: (email: string, password: string) => Promise<{ error?: string; session?: Session | null }>
  signup: (email: string, password: string, name: string, phone: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const DEFAULT_SUPER_ADMIN_EMAILS = ["ankit.koniyal000@gmail.com"]
const SUPER_ADMIN_EMAILS = (() => {
  const env = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? ""
  const derived = env
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const merged = new Set([...DEFAULT_SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...derived])
  return Array.from(merged)
})()

const isSuperAdminEmail = (email: string | null | undefined) => {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}

const syncSessionToServer = async (event: "SIGNED_IN" | "SIGNED_OUT", session?: Session | null) => {
  try {
    await fetch("/api/auth/set", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        access_token: session?.access_token ?? null,
        refresh_token: session?.refresh_token ?? null,
      }),
    })
  } catch (error) {
    console.warn("[auth] failed to sync session", error)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseRef = useRef(createClient())
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string, email?: string | null): Promise<Profile | null> => {
    try {
      const supabase = supabaseRef.current
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("[auth] Error loading profile:", error)
        return null
      }
      let profileData = data || null

      if (profileData && email && isSuperAdminEmail(email) && profileData.role !== "super_admin") {
        try {
          const { data: updatedProfile, error: updateError } = await supabase
            .from("profiles")
            .update({ role: "super_admin" })
            .eq("id", userId)
            .select()
            .single()

          if (updateError) {
            console.warn("[auth] Failed to elevate profile role", updateError)
          } else {
            profileData = updatedProfile
          }
        } catch (roleError) {
          console.warn("[auth] Unexpected role elevation error", roleError)
        }
      }

      return profileData
    } catch (error) {
      console.error("[auth] Unexpected error loading profile:", error)
      return null
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const freshProfile = await loadProfile(user.id, user.email)
      setProfile(freshProfile)
      return freshProfile
    }
    return null
  }, [user?.id, user?.email, loadProfile])

  useEffect(() => {
    let isMounted = true
    const supabase = supabaseRef.current

    const initialise = async () => {
      setIsLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const profileData = await loadProfile(currentUser.id, currentUser.email)
          if (!isMounted) return
          setProfile(profileData)
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.warn("[auth] initial session fetch failed", error)
        if (isMounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initialise()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      console.log("[auth] state change", event)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setIsLoading(false)

      if (currentUser) {
        loadProfile(currentUser.id, currentUser.email).then((profileData) => {
          if (!isMounted) return
          setProfile(profileData)
        })
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const login = async (email: string, password: string) => {
    try {
      const supabase = supabaseRef.current
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        console.error("[auth] login error", error)
        return { error: error.message }
      }

      const session = data.session
      if (session?.user) {
        // Check account status before allowing login
        const accountStatus = session.user.user_metadata?.account_status as string | undefined
        const profileData = await loadProfile(session.user.id, session.user.email)
        
        // Check status from profile if not in metadata
        const status = accountStatus || profileData?.status || "active"
        
        // Block login if account is banned, suspended, or deleted
        if (status === "banned") {
          // Sign out immediately
          await supabase.auth.signOut()
          return { 
            error: "Your account has been banned. Please contact support for resolution." 
          }
        }
        
        if (status === "suspended") {
          // Sign out immediately
          await supabase.auth.signOut()
          return { error: "Your account has been suspended. Please contact support for resolution." }
        }
        
        if (status === "deleted") {
          // Sign out immediately
          await supabase.auth.signOut()
          return { 
            error: "This account has been deleted. Please contact support for resolution." 
          }
        }
        
        // Account is active, proceed with login
        await syncSessionToServer("SIGNED_IN", session)
        setUser(session.user)
        setProfile(profileData)
      }

      return { session }
    } catch (error) {
      console.error("[auth] unexpected login error", error)
      return { error: "Login failed. Please try again." }
    }
  }

  const signup = async (email: string, password: string, name: string, phone: string) => {
    try {
      const supabase = supabaseRef.current
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

      if (error) {
        console.error("[auth] signup error", error)
        return { error: error.message }
      }

      return {}
    } catch (error) {
      console.error("[auth] unexpected signup error", error)
      return { error: "Signup failed. Please try again." }
    }
  }

  const logout = async () => {
    try {
      const supabase = supabaseRef.current
      await supabase.auth.signOut()
      await syncSessionToServer("SIGNED_OUT")
      setUser(null)
      setProfile(null)
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("coinmint_rememberedCredentials")
        } catch (error) {
          console.warn("[auth] failed to clear remembered credentials", error)
        }
        window.location.replace("/auth/login")
      }
    } catch (error) {
      console.error("[auth] logout error", error)
      throw error
    }
  }

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isLoading,
      isAdmin:
        !!profile && ["admin", "super_admin", "owner"].includes((profile.role ?? (isSuperAdminEmail(user?.email) ? "super_admin" : "user")) as string),
      isSuperAdmin: (profile?.role ?? undefined) === "super_admin" || isSuperAdminEmail(user?.email),
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [user, profile, isLoading],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
