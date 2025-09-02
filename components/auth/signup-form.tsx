"use client"
import { useState } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import { SuccessOverlay } from "@/components/ui/success-overlay"
import { getSupabaseClient } from "@/lib/supabase/client"

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const fullName = (formData.get("fullName") as string)?.trim()
    const email = (formData.get("email") as string)?.trim()
    const phone = (formData.get("phone") as string)?.trim()
    const password = (formData.get("password") as string) || ""

    if (!fullName || !email || !password) {
      setError("Please fill in all required fields.")
      return
    }
    if (!agreeToTerms) {
      setError("Please agree to the Terms and Privacy Policy to continue.")
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = await getSupabaseClient()
      if (!supabase) {
        setError("Authentication is not configured. Please try again later.")
        return
      }

      const redirect =
        (typeof window !== "undefined" && `${window.location.origin}/auth/callback`) ||
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL

      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone: phone || undefined },
          emailRedirectTo: redirect || (typeof window !== "undefined" ? window.location.origin : undefined),
        },
      })

      if (signErr) {
        let msg = signErr.message || "Failed to create account."
        if (/email rate/i.test(msg)) msg = "Too many signup attempts. Please try again later."
        if (/invalid email/i.test(msg)) msg = "Please enter a valid email address."
        if (/password/i.test(msg) && /short|length/i.test(msg)) msg = "Password must be at least 6 characters."
        setError(msg)
        return
      }

      // If session exists (auto-confirm), ensure profile now (non-blocking)
      try {
        const session = (await supabase.auth.getSession()).data.session
        if (session?.user) {
          fetch("/api/profile/ensure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ fullName, phone }),
          }).catch(() => {})
        }
      } catch {}

      // Success: show overlay and instruct email confirmation
      setSuccessOpen(true)
      setTimeout(() => {
        setSuccessOpen(false)
        router.push("/?signup=ok")
      }, 2500)
    } catch (e: any) {
      console.error("[signup] error:", e?.message || e)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="Enter your email" className="pl-10" required />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" name="phone" type="tel" placeholder="Enter your phone number" className="pl-10" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min. 6 characters)"
                  className="pl-10 pr-10"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-3 p-3 border rounded-lg bg-gray-50">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(!!checked)}
                className="mt-1 border-2 border-gray-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                I agree to the{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm font-normal text-green-600 hover:text-green-700"
                >
                  Terms of Service
                </Button>{" "}
                and{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm font-normal text-green-600 hover:text-green-700"
                >
                  Privacy Policy
                </Button>
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={!agreeToTerms || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <SuccessOverlay
        open={successOpen}
        title="Account created"
        message="Check your email to confirm your account. After confirming, you’ll be signed in automatically."
        onClose={() => setSuccessOpen(false)}
        actionLabel="Okay"
      />
    </>
  )
}
