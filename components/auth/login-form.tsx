"use client"

import { useState, useEffect, Suspense } from "react"
import type React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { SuccessOverlay } from "@/components/ui/success-overlay"
import { getSupabaseClient } from "@/lib/supabase/client"

// Wrap the main component with Suspense to handle useSearchParams
function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Safe localStorage utility
  const getSafeLocalStorage = (key: string): string | null => {
    if (typeof window === "undefined") return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  const setSafeLocalStorage = (key: string, value: string): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error("LocalStorage set error:", error)
    }
  }

  const removeSafeLocalStorage = (key: string): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error("LocalStorage remove error:", error)
    }
  }

  const getSafeRedirect = (v: string): string => {
    try {
      const val = (v || "/").trim()
      if (!val.startsWith("/")) return "/"
      if (val.startsWith("/auth")) return "/"
      if (/\/(login|signup|sign-up|sign-in)/i.test(val)) return "/"
      return val
    } catch {
      return "/"
    }
  }

  const rawRedirect = searchParams.get("redirectedFrom") || "/"
  const redirectedFrom = getSafeRedirect(rawRedirect)

  // Initialize component after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load saved credentials only after component mounts
  useEffect(() => {
    if (!mounted) return

    const savedCredentials = getSafeLocalStorage("rememberedCredentials")
    if (savedCredentials) {
      try {
        const { email: savedEmail, rememberMe: savedRememberMe } = JSON.parse(savedCredentials)
        if (savedRememberMe && savedEmail) {
          setEmail(savedEmail)
          setRememberMe(true)
        }
      } catch (error) {
        console.error("Error loading saved credentials:", error)
        removeSafeLocalStorage("rememberedCredentials")
      }
    }
  }, [mounted])

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const getAuthErrorMessage = (errorMessage: string): string => {
    const message = errorMessage.toLowerCase()
    
    if (message.includes("invalid login credentials") || message.includes("invalid email or password")) {
      return "Invalid email or password. Please check your credentials and try again."
    } else if (message.includes("email not confirmed") || message.includes("confirmation")) {
      return "Please confirm your email before signing in. Check your inbox for a confirmation link."
    } else if (message.includes("too many") || message.includes("rate")) {
      return "Too many login attempts. Please wait a few minutes and try again."
    } else if (message.includes("network") || message.includes("fetch")) {
      return "Network error. Please check your connection and try again."
    } else if (message.includes("signup") || message.includes("sign up")) {
      return "Account not found. Please sign up first or check your email address."
    } else {
      return "An error occurred during login. Please try again."
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      if (!email.trim() || !password) {
        setError("Please fill in all required fields")
        setIsSubmitting(false)
        return
      }

      if (!isValidEmail(email.trim())) {
        setError("Please enter a valid email address")
        setIsSubmitting(false)
        return
      }

      console.log("[Login] Attempt for email:", email.trim())

      await new Promise((resolve) => setTimeout(resolve, 200))

      const supabase = await getSupabaseClient()
      if (!supabase) {
        setError("Authentication service is not available. Please refresh the page and try again.")
        setIsSubmitting(false)
        return
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (authError) {
        console.error("[Login] Auth error:", authError?.message)
        setError(getAuthErrorMessage(authError.message))
        setIsSubmitting(false)
        return
      }

      if (data.session && data.user) {
        console.log("[Login] Successful for:", data.user.email)

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error("[Login] Profile fetch error:", profileError.message)
          setError("Failed to retrieve user profile. Please contact support.")
          setIsSubmitting(false)
          return
        }

        const userRole = String(profileData.role || 'user')
        const isSuperAdmin = userRole === 'super_admin'
        const redirectPath = isSuperAdmin ? '/superadmin' : '/dashboard'

        console.log("[Login] User role:", userRole, "Redirecting to:", redirectPath)
        
        if (rememberMe) {
          setSafeLocalStorage("rememberedCredentials", JSON.stringify({ 
            email: email.trim(), 
            rememberMe: true 
          }))
        } else {
          removeSafeLocalStorage("rememberedCredentials")
        }

        setSuccessOpen(true)
        setIsSubmitting(false)

        setTimeout(() => {
          setSuccessOpen(false)
          try {
            router.replace(redirectPath)
          } catch (routerError) {
            console.log("[Login] Router failed, using window.location:", routerError)
            if (typeof window !== "undefined") {
              window.location.href = redirectPath
            }
          }
        }, 1200)

      } else {
        setError("Sign in failed. Please try again.")
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error("[Login] Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-900"></div>
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          {redirectedFrom !== "/" && (
            <p className="text-sm text-muted-foreground text-center">Please sign in to continue</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  minLength={6}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-2 border-gray-300 data-[state=checked]:bg-green-900 data-[state=checked]:border-green-900"
                  disabled={isSubmitting}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer font-medium">
                  Remember me
                </Label>
              </div>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm"
                disabled={isSubmitting}
                onClick={() => router.push("/auth/forgot-password")}
              >
                Forgot password?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-900 hover:bg-green-950"
              disabled={isSubmitting || !email || !password}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm"
                disabled={isSubmitting}
                onClick={() => router.push("/auth/signup")}
              >
                Sign up
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
      <SuccessOverlay
        open={successOpen}
        title="Signed in"
        message="You have been successfully logged in."
        onClose={() => {
          setSuccessOpen(false)
          setIsSubmitting(false)
        }}
        actionLabel="Continue"
      />
    </div>
  )
}

// Main export with Suspense boundary
export default function LoginForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-900"></div>
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'
