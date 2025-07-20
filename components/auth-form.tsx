"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Shield } from "lucide-react"

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
  })
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  // Hardcoded OTP for demo
  const DEMO_OTP = "123456"

  const handleSignIn = async (formData: FormData) => {
    setIsLoading(true)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await signIn(email, password)

    if (result.success) {
      toast({
        title: "Success",
        description: "Signed in successfully!",
      })
      router.push("/")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to sign in",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  const handleSignUpSubmit = async (formData: FormData) => {
    setIsLoading(true)
    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const mobile = formData.get("mobile") as string
    const password = formData.get("password") as string

    // Validate mobile number (basic validation)
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Store signup data and show OTP dialog
    setSignupData({ fullName, email, mobile, password })
    setShowOtpDialog(true)
    setIsLoading(false)

    // Simulate sending OTP
    toast({
      title: "OTP Sent",
      description: `OTP sent to ${mobile}. Use 123456 for demo.`,
    })
  }

  const handleOtpVerification = async () => {
    if (otpValue !== DEMO_OTP) {
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Complete signup after OTP verification
    const result = await signUp(signupData.email, signupData.password, signupData.fullName)

    if (result.success) {
      toast({
        title: "Success",
        description: "Account created successfully!",
      })
      setShowOtpDialog(false)
      router.push("/")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create account",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Marketplace</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
            <br />
            <small className="text-xs text-gray-500 mt-2 block">Demo: Use any email with password "password123"</small>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form action={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="password123" required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form action={handleSignUpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" type="text" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    required
                  />
                  <small className="text-xs text-gray-500">Enter 10-digit mobile number</small>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" minLength={6} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Send OTP"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Verify Mobile Number
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                We've sent a 6-digit OTP to <strong>{signupData.mobile}</strong>
              </p>
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Demo OTP:</strong> 123456
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowOtpDialog(false)} className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleOtpVerification} className="flex-1" disabled={isLoading || otpValue.length !== 6}>
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>

            <div className="text-center">
              <Button variant="link" size="sm" className="text-blue-600">
                Resend OTP
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
