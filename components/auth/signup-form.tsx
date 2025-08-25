"use client"
import { useState } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Phone, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const phone = formData.get("phone") as string

    try {
      const result = await signup(email, password, fullName, phone)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
      } else {
        setSuccess("Check your email to confirm your account.")
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (err) {
      console.error("Signup error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
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

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Account created successfully!</p>
                  <p className="text-sm">{success}</p>
                  <p className="text-sm font-medium">Redirecting to homepage...</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* ... existing form fields ... */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" name="email" type="email" placeholder="Enter your email" className="pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="phone" name="phone" type="tel" placeholder="Enter your phone number" className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 border rounded-lg bg-gray-50">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              className="mt-1 border-2 border-gray-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              I agree to the{" "}
              <Button variant="link" className="p-0 h-auto text-sm font-normal text-green-600 hover:text-green-700">
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button variant="link" className="p-0 h-auto text-sm font-normal text-green-600 hover:text-green-700">
                Privacy Policy
              </Button>
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={!agreeToTerms || isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
