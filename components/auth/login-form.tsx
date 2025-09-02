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
import { useAuth } from "@/hooks/use-auth"
import { SuccessOverlay } from "@/components/ui/success-overlay"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)

  const redirectedFrom = searchParams.get("redirectedFrom") || "/"

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

    if (!email.trim() || !password) {
      setError("Please fill in all required fields")
      return
    }

    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)
    try {
      if (rememberMe) {
        localStorage.setItem("rememberedCredentials", JSON.stringify({ email: email.trim(), rememberMe: true }))
      } else {
        localStorage.removeItem("rememberedCredentials")
      }

      const existsResponse = await fetch("/api/auth/exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (existsResponse.ok) {
        const existsData = await existsResponse.json()
        if (existsData.ok && !existsData.exists) {
          setError("No account found for this email. Please sign up first.")
          return
        }
      }
    } catch (error) {
      console.warn("Account check failed, proceeding with login:", error)
    }

    try {
      const result = await login(email.trim(), password)

      if (result?.error) {
        const errorMessage = String(result.error)
        let userFriendlyError = "An error occurred during login"
        if (/invalid login credentials|invalid email or password/i.test(errorMessage)) {
          userFriendlyError = "Invalid email or password. Please try again."
        } else if (/email not confirmed|confirmation/i.test(errorMessage)) {
          userFriendlyError = "Please confirm your email before signing in."
        } else if (/too many|rate/i.test(errorMessage)) {
          userFriendlyError = "Too many attempts. Please wait a few minutes and try again."
        } else if (/auth not configured|supabase/i.test(errorMessage)) {
          userFriendlyError = "Authentication is not configured. Please try again later."
        }
        setError(userFriendlyError)
        return
      }

      fetch("/api/profile/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {})

      setSuccessOpen(true)
      setTimeout(() => {
        setSuccessOpen(false)
        router.push(redirectedFrom)
        router.refresh()
      }, 1200)
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
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
                  className="border-2 border-gray-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
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
                onClick={() => router.push("/forgot-password")}
              >
                Forgot password?
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !email || !password}>
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
        onClose={() => setSuccessOpen(false)}
        actionLabel="Continue"
      />
    </>
  )
}
