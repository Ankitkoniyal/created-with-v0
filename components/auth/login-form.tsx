"use client"
import { useState, useEffect } from "react"
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

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)

  const rawRedirect = searchParams.get("redirectedFrom") || "/"
  const getSafeRedirect = (v: string) => {
    try {
      const val = (v || "/").trim()
      if (!val.startsWith("/")) return "/"
      // prevent redirect loops to auth pages
      if (val.startsWith("/auth")) return "/"
      // optionally block login/signup words anywhere
      if (/\/(login|signup|sign-up|sign-in)/i.test(val)) return "/"
      return val
    } catch {
      return "/"
    }
  }
  const redirectedFrom = getSafeRedirect(rawRedirect)

  useEffect(() => {
    try {
      const savedCredentials = localStorage.getItem("rememberedCredentials")
      if (savedCredentials) {
        const { email: savedEmail, rememberMe: savedRememberMe } = JSON.parse(savedCredentials)
        if (savedRememberMe && savedEmail) {
          setEmail(savedEmail)
          setRememberMe(true)
        }
      }
    } catch (error) {
      console.error("Error loading saved credentials:", error)
    }
  }, [])

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      if (!email.trim() || !password) {
        setError("Please fill in all required fields")
        return
      }

      if (!isValidEmail(email.trim())) {
        setError("Please enter a valid email address")
        return
      }

      console.log("[v0] Login attempt for email:", email.trim())

      const supabase = await getSupabaseClient()
      if (!supabase) {
        setError("Authentication service is not available. Please refresh the page and try again.")
        return
      }

      if (rememberMe) {
        localStorage.setItem("rememberedCredentials", JSON.stringify({ email: email.trim(), rememberMe: true }))
      } else {
        localStorage.removeItem("rememberedCredentials")
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (authError) {
        console.error("[v0] Auth error:", authError)
        const errorMessage = String(authError.message || authError)
        let userFriendlyError = "An error occurred during login"

        if (/invalid login credentials|invalid email or password/i.test(errorMessage)) {
          userFriendlyError = "Incorrect email or password. Please try again."
        } else if (/email not confirmed|confirmation/i.test(errorMessage)) {
          userFriendlyError = "Please confirm your email before signing in."
        } else if (/too many|rate/i.test(errorMessage)) {
          userFriendlyError = "Too many attempts. Please wait a few minutes and try again."
        } else if (/network|fetch/i.test(errorMessage)) {
          userFriendlyError = "Network error. Please check your connection and try again."
        }

        setError(userFriendlyError)
        return
      }

      if (data.session && data.user) {
        console.log("[v0] Login successful for:", data.user.email)

        fetch("/api/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        }).catch((err) => console.log("[v0] Cookie sync failed (non-blocking):", err))

        fetch("/api/profile/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch((err) => console.log("[v0] Profile ensure failed (non-blocking):", err))

        setSuccessOpen(true)

        setTimeout(() => {
          setSuccessOpen(false)
          console.log("[v0] Redirecting to:", redirectedFrom)
          router.replace(redirectedFrom)

          setTimeout(() => {
            if (typeof window !== "undefined" && window.location.pathname.startsWith("/auth")) {
              console.log("[v0] Hard redirect to:", redirectedFrom)
              window.location.assign(redirectedFrom)
            }
          }, 500)
        }, 1500)
      } else {
        setError("Sign in failed. Please try again.")
      }
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError("Network error. Please check your connection and try again.")
    } finally {
      if (!successOpen) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <>
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
    </>
  )
}
