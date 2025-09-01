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
import { getSupabaseClient } from "@/lib/supabase/client"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)

  const redirectedFrom = searchParams.get("redirectedFrom")

  useEffect(() => {
    const savedCredentials = localStorage.getItem("rememberedCredentials")
    if (savedCredentials) {
      try {
        const { email: savedEmail, rememberMe: savedRememberMe } = JSON.parse(savedCredentials)
        if (savedRememberMe) {
          setEmail(savedEmail || "")
          setRememberMe(true)
        }
      } catch (error) {
        console.error("Error loading saved credentials:", error)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const emailValue = (formData.get("email") as string)?.trim()
    const passwordValue = (formData.get("password") as string) || ""

    if (!emailValue || !passwordValue) {
      setError("Please fill in all required fields")
      setIsSubmitting(false)
      return
    }

    if (!emailValue.includes("@")) {
      setError("Please enter a valid email address")
      setIsSubmitting(false)
      return
    }

    try {
      console.log("[v0] Login attempt for email:", emailValue)

      if (rememberMe) {
        localStorage.setItem(
          "rememberedCredentials",
          JSON.stringify({
            email: emailValue,
            rememberMe: true,
          }),
        )
      } else {
        localStorage.removeItem("rememberedCredentials")
      }

      // Soft pre-check can remain, but never block a valid login.
      try {
        const existsResult = (await Promise.race([
          fetch("/api/auth/exists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ email: emailValue }),
          }).then((r) => r.json()),
          // Fallback after 4s - soft-allow
          new Promise<{ ok: boolean; exists: boolean }>((resolve) =>
            setTimeout(() => resolve({ ok: true, exists: true }), 4000),
          ),
        ])) as any

        if (existsResult?.ok === true && existsResult?.exists === false) {
          setError("No account found for this email. Please sign up first.")
          setIsSubmitting(false)
          return
        }
      } catch {
        // ignore – soft-allow
      }

      // IMPORTANT: remove artificial timeout that caused false "Network timeout" errors.
      const result = (await login(emailValue, passwordValue)) as { error?: string }
      console.log("[v0] Login result:", result)

      if (result?.error) {
        // Fast fallback: if session already exists, treat as success to avoid split-brain
        try {
          const s = await getSupabaseClient()
          if (s) {
            const ok = await (async () => {
              const start = Date.now()
              while (Date.now() - start < 2000) {
                const { data } = await s.auth.getSession()
                if (data?.session?.user) return true
                await new Promise((r) => setTimeout(r, 200))
              }
              return false
            })()
            if (ok || user) {
              const destination = redirectedFrom || "/"
              setSuccessOpen(true)
              setTimeout(() => {
                setSuccessOpen(false)
                router.push(destination)
                router.refresh()
              }, 1200)
              setIsSubmitting(false)
              return
            }
          }
        } catch {
          // ignore and fall through to show error
        }

        // normalize network wording; avoid “timeout” unless truly no session
        setError("Network error. Please try again.")
        setIsSubmitting(false)
      } else {
        // Fire-and-forget: ensure profile exists on the server using current session cookies
        fetch("/api/profile/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({}),
        }).catch(() => {})

        const destination = redirectedFrom || "/"
        setSuccessOpen(true)
        setTimeout(() => {
          setSuccessOpen(false)
          router.push(destination)
          router.refresh()
        }, 2000) // was ~1.4s; give users time to read
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          {redirectedFrom && <p className="text-sm text-muted-foreground text-center">Please sign in to continue</p>}
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
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-2 border-gray-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  disabled={isSubmitting}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer font-medium">
                  Remember me
                </Label>
              </div>
              <Button variant="link" className="p-0 h-auto text-sm" disabled={isSubmitting}>
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
