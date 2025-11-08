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
import { createClient } from "@/lib/supabase/client"

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
  if (!redirectUrl) return "/"
  try {
    const url = new URL(redirectUrl, window.location.origin)
    // Only allow same-origin redirects
    if (url.origin !== window.location.origin) return "/"
    
    const blockedPaths = ["/auth", "/login", "/signup"]
    if (blockedPaths.some(path => url.pathname.startsWith(path))) return "/"
    
    return url.pathname + url.search
  } catch {
    return "/"
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
  const supabase = createClient()
  
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const rawRedirect = searchParams.get("redirectedFrom") || "/"
  const redirectedFrom = getSafeRedirect(rawRedirect)
  const message = searchParams.get("message")

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

      // Attempt login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      })

      if (authError) {
        setError(getAuthErrorMessage(authError.message))
        setIsSubmitting(false)
        return
      }

      if (!data.session || !data.user) {
        setError("Sign in failed. Please try again.")
        setIsSubmitting(false)
        return
      }

      // Fetch user profile for role-based routing
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error("Profile fetch error:", profileError)
        // Continue with default routing if profile fetch fails
      }

      // Determine redirect path
      const userRole = profileData?.role || 'user'
      const userEmail = data.user.email
      
      // Super admin must have BOTH the role AND the specific email
      const isSuperAdmin = userRole === 'super_admin' && userEmail === "ankit.koniyal000@gmail.com"
      const redirectPath = isSuperAdmin ? '/superadmin' : '/dashboard'

      console.log("🔐 Login Redirect:", {
        userEmail,
        userRole,
        isSuperAdmin,
        redirectPath
      })

      // Handle remember me
      if (rememberMe) {
        setItem("coinmint_rememberedCredentials", JSON.stringify({ 
          email: trimmedEmail, 
          rememberMe: true 
        }))
      } else {
        removeItem("coinmint_rememberedCredentials")
      }

      // Show success and redirect
      setSuccessOpen(true)
      setTimeout(() => {
        setSuccessOpen(false)
        router.replace(redirectPath)
      }, 1500)

    } catch (err) {
      console.error("Login error:", err)
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
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            Sign In
          </CardTitle>
          <p className="text-sm text-center text-gray-600">
            Access your account
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 border-gray-300 focus:border-green-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 border-gray-300 focus:border-green-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  minLength={6}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
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
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  disabled={isSubmitting}
                  className="data-[state=checked]:bg-green-800"
                />
                <Label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm text-green-800 hover:text-green-900"
                disabled={isSubmitting}
                onClick={() => router.push("/auth/forgot-password")}
              >
                Forgot password?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-800 hover:bg-green-900 text-white font-semibold py-2.5 transition-colors"
              disabled={isSubmitting || !email.trim() || !password}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-green-800 hover:text-green-900 font-medium"
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
        message={message === "check_email" 
          ? "Please check your email to verify your account before signing in." 
          : "Welcome back! Redirecting..."}
        onClose={() => setSuccessOpen(false)}
        actionLabel="Continue"
      />
    </>
  )
}

// Export with Suspense boundary
export default function LoginForm() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-800"></div>
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </CardContent>
      </Card>
    }>
      <LoginFormContent />
    </Suspense>
  )
}
