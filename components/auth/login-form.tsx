"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { SuccessOverlay } from "@/components/ui/success-overlay"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

const DEFAULT_SUPER_ADMIN_EMAILS = ["ankit.koniyal000@gmail.com"]
const SUPER_ADMIN_EMAILS = (() => {
  const env = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? ""
  const derived = env
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const merged = new Set([...DEFAULT_SUPER_ADMIN_EMAILS.map((email) => email.toLowerCase()), ...derived])
  return Array.from(merged)
})()

const isSuperAdminEmail = (email: string | null | undefined) => {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}

// Client storage utilities
const useClientStorage = () => {
  const getItem = (key: string): string | null => {
    if (typeof window === "undefined") return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  const setItem = (key: string, value: string): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(key, value)
    } catch {
      // Ignore storage errors
    }
  }

  const removeItem = (key: string): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore storage errors
    }
  }

  return { getItem, setItem, removeItem }
}

// Validation utilities
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const sanitizeInput = (input: string): string => {
  return input.trim()
}

const getSafeRedirect = (redirectUrl: string | null): string => {
  if (!redirectUrl) return "/dashboard"
  try {
    const url = new URL(redirectUrl, window.location.origin)
    // Only allow same-origin redirects
    if (url.origin !== window.location.origin) return "/dashboard"
    const blockedPaths = ["/auth", "/login", "/signup"]
    if (blockedPaths.some((path) => url.pathname.startsWith(path))) return "/dashboard"
    return url.pathname + url.search
  } catch {
    return "/dashboard"
  }
}

const getAuthErrorMessage = (errorMessage: string): string => {
  const message = errorMessage.toLowerCase()

  if (message.includes("invalid login credentials") || message.includes("invalid email or password")) {
    return "Invalid email or password. Please check your credentials."
  } else if (message.includes("email not confirmed")) {
    return "Please confirm your email before signing in."
  } else if (message.includes("too many") || message.includes("rate")) {
    return "Too many login attempts. Please wait a few minutes."
  } else if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Please check your connection."
  } else {
    return "An error occurred during login. Please try again."
  }
}

// Main form component
function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getItem, setItem, removeItem } = useClientStorage()
  const { login, refreshProfile } = useAuth()
  const supabase = createClient()

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const rawRedirect = searchParams.get("redirectedFrom")
  const redirectedFrom = getSafeRedirect(rawRedirect)
  const message = searchParams.get("message")
  const welcomeParam = searchParams.get("welcome")
  const errorParam = searchParams.get("error")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show success message if redirected from signup
  useEffect(() => {
    if (message === "check_email") {
      setSuccessOpen(true)
      setTimeout(() => setSuccessOpen(false), 3000)
    }
  }, [message])

  // Show error message if redirected with error (e.g., banned/suspended account)
  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [errorParam])

  // Load saved credentials after mount
  useEffect(() => {
    if (!mounted) return

    const savedCredentials = getItem("coinmint_rememberedCredentials")
    if (savedCredentials) {
      try {
        const { email: savedEmail, rememberMe: savedRememberMe } = JSON.parse(savedCredentials)
        if (savedRememberMe && savedEmail && isValidEmail(savedEmail)) {
          setEmail(savedEmail)
          setRememberMe(true)
        }
      } catch {
        removeItem("coinmint_rememberedCredentials")
      }
    }
  }, [mounted, getItem, removeItem])

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isSubmitting) return
    
    setIsGoogleLoading(true)
    setError(null)

    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "http://localhost:3000/auth/callback"

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (oauthError) {
        console.error("❌ Google OAuth error:", oauthError)
        setError("Failed to sign in with Google. Please try again.")
        setIsGoogleLoading(false)
      }
      // If successful, user will be redirected to Google, then back to callback
      // Don't set loading to false here as the redirect will happen
    } catch (err) {
      console.error("❌ Google OAuth exception:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      // Validate inputs
      const trimmedEmail = sanitizeInput(email)

      if (!trimmedEmail || !password) {
        setError("Please fill in all required fields")
        setIsSubmitting(false)
        return
      }

      if (!isValidEmail(trimmedEmail)) {
        setError("Please enter a valid email address")
        setIsSubmitting(false)
        return
      }

      console.log("🔐 LOGIN ATTEMPT:", { email: trimmedEmail })

      // Attempt login via context helper (handles server sync)
      const { error: loginError, session } = await login(trimmedEmail, password)

      if (loginError || !session?.user) {
        // Use the error message directly (it may contain account status details)
        setError(loginError || "Login failed. Please try again.")
        setIsSubmitting(false)
        return
      }

      console.log("✅ LOGIN SUCCESS:", { 
        userId: session.user.id, 
        userEmail: session.user.email 
      })

      // Get user profile with more detailed query
      const { data: profileLookup, error: profileError } = await supabase
        .from("profiles")
        .select("role, email, id")
        .eq("id", session.user.id)
        .single()

      console.log("📊 PROFILE DATA:", {
        profileLookup,
        profileError,
        profileExists: !!profileLookup
      })

      // Enhanced super admin check
      let userRole = profileLookup?.role || "user"
      const emailIsSuperAdmin = isSuperAdminEmail(trimmedEmail)

      if (emailIsSuperAdmin && userRole !== "super_admin") {
        try {
          const { error: elevateError } = await supabase
            .from("profiles")
            .update({ role: "super_admin" })
            .eq("id", session.user.id)

          if (elevateError) {
            console.warn("Failed to elevate user role to super_admin", elevateError)
          } else {
            userRole = "super_admin"
          }
        } catch (roleError) {
          console.warn("Unexpected error elevating user role", roleError)
        }
      }

      const isSuperAdmin = emailIsSuperAdmin || userRole === "super_admin"
      const roleRedirectPath = isSuperAdmin ? "/superadmin" : "/dashboard"
      let finalRedirectTarget = redirectedFrom || roleRedirectPath

      if (isSuperAdmin) {
        if (!redirectedFrom || redirectedFrom === "/dashboard" || redirectedFrom === "/dashboard/") {
          finalRedirectTarget = "/superadmin"
        }
      }

      console.log("🔐 Login Redirect:", {
        trimmedEmail,
        userRole,
        isSuperAdmin,
        redirectPath: finalRedirectTarget,
      })

      // Handle remember me
      if (rememberMe) {
        setItem("coinmint_rememberedCredentials", JSON.stringify({
          email: trimmedEmail,
          rememberMe: true,
        }))
      } else {
        removeItem("coinmint_rememberedCredentials")
      }

      // Show success feedback
      setSuccessOpen(true)
      setIsSubmitting(false)

      // Check if this is a first-time login (new signup) by checking welcome parameter
      const isNewSignup = welcomeParam === "true"
      const redirectUrl = isNewSignup 
        ? `${finalRedirectTarget}${finalRedirectTarget.includes('?') ? '&' : '?'}welcome=true`
        : finalRedirectTarget

      // Add a small delay to see the success message and ensure all data is loaded
      console.log("🔄 WAITING 1 SECOND BEFORE REDIRECT...")
      setTimeout(() => {
        console.log("🎯 FINAL REDIRECT TO:", redirectUrl)
        try {
          window.location.href = redirectUrl
        } catch (navError) {
          console.error("Redirect failed:", navError)
          router.replace(redirectUrl)
        }
      }, 1000)

    } catch (err) {
      console.error("❌ LOGIN ERROR:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (!mounted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-800"></div>
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full shadow-lg border border-gray-200 bg-white">
        <CardContent className="px-5 py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email *
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-800 transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 pr-4 h-10 border-gray-300 focus:border-green-800 focus:ring-2 focus:ring-green-800/20 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password *
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-800 transition-colors" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-10 border-gray-300 focus:border-green-800 focus:ring-2 focus:ring-green-800/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  minLength={6}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2.5">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  disabled={isSubmitting}
                  className="data-[state=checked]:bg-green-800 data-[state=checked]:border-green-800 border-gray-300"
                />
                <Label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer font-medium">
                  Remember me
                </Label>
              </div>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm text-green-800 hover:text-green-900 font-medium"
                disabled={isSubmitting}
                onClick={() => router.push("/auth/forgot-password")}
              >
                Forgot password?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-900 hover:to-green-950 text-white font-semibold py-2.5 rounded-md shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isSubmitting || !email.trim() || !password}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isGoogleLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-md border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-2"></div>
                Connecting...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </div>
            )}
          </Button>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              Don&apos;t have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-green-800 hover:text-green-900 font-semibold underline-offset-4 hover:underline"
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
        title={message === "check_email" ? "Check Your Email" : "Signed In Successfully"}
        message={
          message === "check_email"
            ? "Please check your email to verify your account before signing in."
            : "Welcome back! Redirecting..."
        }
        onClose={() => setSuccessOpen(false)}
        actionLabel="Continue"
      />
    </>
  )
}

// Export with Suspense boundary
export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-800"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </CardContent>
        </Card>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}