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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
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

    if (password.length < 8) {
      return "Password must be at least 8 characters long."
    }
    
    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    
    if (!hasLetter || !hasNumber) {
      return "Password must contain at least one letter and one number."
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
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { exists: false } // Fallback - let signup proceed and catch error there
      }

      return {
        exists: data.exists || false,
        blocked: data.blocked || false,
        status: data.status,
        message: data.message
      }
    } catch (error) {
      // Fallback - let signup proceed and catch error there
      return { exists: false }
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

      // Check if email exists
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

      // Email is available, proceeding with signup

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
        // Check if email already exists
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

      // Signup successful
      
      if (data.user) {
        // For email signup, redirect to login with welcome parameter
        // The login page will handle showing welcome message after email confirmation
        router.push("/auth/login?welcome=true&message=check_email")
      } else {
        setError("Failed to create account. Please try again.")
        setIsSubmitting(false)
      }

    } catch (error: any) {
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (isGoogleLoading || isSubmitting || checkingEmail) return
    
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
        setError("Failed to sign up with Google. Please try again.")
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

  return (
    <>
      <Card className="w-full shadow-lg border border-gray-200 bg-white">
        <CardContent className="px-5 py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
                Full Name *
              </Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-800 transition-colors" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10 pr-4 h-10 border-gray-300 focus:border-green-800 focus:ring-2 focus:ring-green-800/20 transition-all"
                  required
                  disabled={isSubmitting || checkingEmail}
                />
              </div>
            </div>

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
                  required
                  disabled={isSubmitting || checkingEmail}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                Phone Number
              </Label>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-800 transition-colors" />
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  placeholder="Enter your phone number" 
                  className="pl-10 pr-4 h-10 border-gray-300 focus:border-green-800 focus:ring-2 focus:ring-green-800/20 transition-all"
                  disabled={isSubmitting || checkingEmail}
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
                  placeholder="Create a password (min. 8 characters, letter + number)"
                  className="pl-10 pr-10 h-10 border-gray-300 focus:border-green-800 focus:ring-2 focus:ring-green-800/20 transition-all"
                  minLength={8}
                  required
                  disabled={isSubmitting || checkingEmail}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || checkingEmail}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(!!checked)}
                className="data-[state=checked]:bg-green-800 data-[state=checked]:border-green-800 border-gray-300"
                disabled={isSubmitting || checkingEmail}
              />
              <Label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer font-medium flex-1">
                I agree to the{" "}
                <Button type="button" variant="link" className="p-0 h-auto text-green-800 hover:text-green-900 text-sm font-medium inline">
                  Terms of Service
                </Button>{" "}
                and{" "}
                <Button type="button" variant="link" className="p-0 h-auto text-green-800 hover:text-green-900 text-sm font-medium inline">
                  Privacy Policy
                </Button>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-900 hover:to-green-950 text-white font-semibold py-2.5 rounded-md shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={!agreeToTerms || isSubmitting || checkingEmail}
            >
              {checkingEmail ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Checking Email...
                </div>
              ) : isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
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
            onClick={handleGoogleSignUp}
            disabled={isSubmitting || isGoogleLoading || checkingEmail}
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
                Sign up with Google
              </div>
            )}
          </Button>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-green-800 hover:text-green-900 font-semibold underline-offset-4 hover:underline"
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
