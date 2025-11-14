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
import { createClient } from "@/lib/supabase/client"

interface FormData {
  fullName: string
  email: string
  phone: string
  password: string
}

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const validateForm = (formData: FormData): string | null => {
    const { fullName, email, password } = formData

    if (!fullName || !email || !password) {
      return "Please fill in all required fields."
    }

    if (!agreeToTerms) {
      return "Please agree to the Terms and Privacy Policy to continue."
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters long."
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address."
    }

    return null
  }

  // RELIABLE email check using API route
  const checkEmailExists = async (email: string): Promise<{ exists: boolean; blocked?: boolean; status?: string; message?: string }> => {
    setCheckingEmail(true)
    try {
      console.log("🔍 Checking email existence:", email)
      
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('Email check API error:', data.error)
        return { exists: false } // Fallback - let signup proceed and catch error there
      }

      console.log('✅ Email check result:', data)
      return {
        exists: data.exists || false,
        blocked: data.blocked || false,
        status: data.status,
        message: data.message
      }
    } catch (error) {
      console.error('❌ Email check failed:', error)
      return { exists: false } // Fallback - let signup proceed and catch error there
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting || checkingEmail) return

    setError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const formValues: FormData = {
        fullName: (formData.get("fullName") as string)?.trim() || "",
        email: (formData.get("email") as string)?.trim().toLowerCase() || "",
        phone: (formData.get("phone") as string)?.trim() || "",
        password: (formData.get("password") as string) || ""
      }

      // Validate form
      const validationError = validateForm(formValues)
      if (validationError) {
        setError(validationError)
        setIsSubmitting(false)
        return
      }

      console.log("🚀 Attempting signup for:", formValues.email)
      
      // RELIABLE email check - this will actually work now
      console.log("📧 Checking if email exists via API...")
      const emailCheckResult = await checkEmailExists(formValues.email)
      
      if (emailCheckResult.exists) {
        // Check if account is blocked (banned/suspended)
        if (emailCheckResult.blocked) {
          setError(emailCheckResult.message || "This email cannot be used for signup. Please contact support.")
          setIsSubmitting(false)
          return
        }
        
        // Regular existing account
        setError("An account with this email already exists. Please sign in instead.")
        setIsSubmitting(false)
        return
      }

      console.log("✅ Email is available, proceeding with signup...")

      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "http://localhost:3000/auth/callback"

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formValues.email,
        password: formValues.password,
        options: {
          data: { 
            full_name: formValues.fullName, 
            phone: formValues.phone || undefined 
          },
          emailRedirectTo: redirectUrl,
        },
      })

      if (signUpError) {
        console.error("❌ Signup error:", signUpError)
        
        // DOUBLE CHECK - if somehow email exists but our API missed it
        if (signUpError.message?.includes('already exists') || 
            signUpError.message?.includes('user_already_exists') ||
            signUpError.status === 400 || 
            signUpError.message?.includes('already registered')) {
          setError("An account with this email already exists. Please sign in instead.")
        } else {
          setError("Failed to create account. Please try again.")
        }
        
        setIsSubmitting(false)
        return
      }

      // SUCCESS - user created
      console.log("✅ Signup successful:", data.user?.email)
      
      if (data.user) {
        setSuccessOpen(true)
        setTimeout(() => {
          setSuccessOpen(false)
          router.push("/auth/login?message=check_email")
        }, 2000)
      } else {
        setError("Failed to create account. Please try again.")
        setIsSubmitting(false)
      }

    } catch (error: any) {
      console.error("❌ Unexpected error:", error)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            Create Account
          </CardTitle>
          <p className="text-sm text-center text-gray-600">
            Sign up to get started
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
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10 border-gray-300 focus:border-green-800"
                  required
                  disabled={isSubmitting || checkingEmail}
                />
              </div>
            </div>

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
                  required
                  disabled={isSubmitting || checkingEmail}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  placeholder="Enter your phone number" 
                  className="pl-10 border-gray-300 focus:border-green-800"
                  disabled={isSubmitting || checkingEmail}
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
                  placeholder="Create a password (min. 6 characters)"
                  className="pl-10 pr-10 border-gray-300 focus:border-green-800"
                  minLength={6}
                  required
                  disabled={isSubmitting || checkingEmail}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || checkingEmail}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(!!checked)}
                className="mt-0.5 data-[state=checked]:bg-green-800 data-[state=checked]:border-green-800"
                disabled={isSubmitting || checkingEmail}
              />
              <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer flex-1">
                I agree to the{" "}
                <Button type="button" variant="link" className="p-0 h-auto text-green-800 hover:text-green-900 text-sm">
                  Terms of Service
                </Button>{" "}
                and{" "}
                <Button type="button" variant="link" className="p-0 h-auto text-green-800 hover:text-green-900 text-sm">
                  Privacy Policy
                </Button>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-800 hover:bg-green-900 text-white font-semibold py-2.5 transition-colors"
              disabled={!agreeToTerms || isSubmitting || checkingEmail}
            >
              {checkingEmail ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Checking Email...
                </div>
              ) : isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-green-800 hover:text-green-900 font-medium"
                onClick={() => router.push("/auth/login")}
                disabled={isSubmitting || checkingEmail}
              >
                Sign in
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      <SuccessOverlay
        open={successOpen}
        title="Account Created Successfully"
        message="Please check your email to verify your account before signing in."
        onClose={() => setSuccessOpen(false)}
        actionLabel="Continue to Login"
      />
    </>
  )
}
