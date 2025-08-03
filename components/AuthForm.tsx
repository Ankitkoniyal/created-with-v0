"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { supabase } from '@/utils/supabaseClient'

const PASSWORD_REQUIREMENTS = [
  { id: 'length', text: 'At least 8 characters', regex: /.{8,}/ },
  { id: 'uppercase', text: 'At least 1 uppercase letter', regex: /[A-Z]/ },
  { id: 'lowercase', text: 'At least 1 lowercase letter', regex: /[a-z]/ },
  { id: 'number', text: 'At least 1 number', regex: /[0-9]/ },
  { id: 'special', text: 'At least 1 special character', regex: /[^A-Za-z0-9]/ }
]

export function AuthForm() {
  const { signIn, signUp, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    if (searchParams.get('type') === 'signup') {
      toast({
        title: "Confirm your email",
        description: "Please check your inbox for a confirmation link.",
        variant: "default",
      })
    }
  }, [searchParams, toast])

  const [activeTab, setActiveTab] = useState('signin')
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, boolean>>({})

  const [signInData, setSignInData] = useState({ email: "", password: "" })

  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: ""
  })

  const validatePassword = (password: string) => {
    const errors: Record<string, boolean> = {}
    PASSWORD_REQUIREMENTS.forEach(req => {
      errors[req.id] = !req.regex.test(password)
    })
    setPasswordErrors(errors)
    return !Object.values(errors).some(Boolean)
  }

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSignUpData(prev => ({ ...prev, [name]: value }))
    if (name === 'password') validatePassword(value)
  }

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { email, password } = signInData

    console.log("SIGN IN VALUES:", { email, password })

    try {
      const result = await signIn(email, password)
      if (result.success) {
        toast({
          title: "Success",
          description: "Signed in successfully!",
          variant: "default",
        })
        router.push("/")
      } else {
        toast({
          title: "Error",
          description: result.error || "Invalid email or password",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("UNEXPECTED SIGNIN ERROR:", err)
      toast({
        title: "Unexpected error",
        description: "Something went wrong during sign-in.",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { fullName, email, mobile, password } = signUpData

    if (!fullName || !email || !mobile || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast({
        title: "Invalid mobile number",
        description: "Please enter a valid 10-digit Indian mobile number",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!validatePassword(password)) {
      toast({
        title: "Password doesn't meet requirements",
        description: "Please check the password criteria below",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp(email, password, fullName, mobile)
      console.log("SIGNUP RESULT:", result)

      if (result.success) {
        toast({
          title: "Account created!",
          description: "Check your inbox to confirm your email. Then sign in.",
          variant: "default",
        })
        setActiveTab("signin")
        router.push("?type=signup")
      } else {
        toast({
          title: "Signup failed",
          description: result.error || "Could not create account. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("UNEXPECTED SIGNUP ERROR:", err)
      toast({
        title: "Unexpected error",
        description: "Something went wrong during signup.",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const displayLoading = authLoading || isLoading

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            {activeTab === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required value={signInData.email} onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required value={signInData.password} onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={displayLoading}>
                  {displayLoading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="text-center mt-2">
                  <Button variant="link" size="sm" type="button" onClick={() => setShowForgotPasswordDialog(true)} disabled={displayLoading}>
                    Forgot Password?
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" required value={signUpData.fullName} onChange={handleSignUpChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required value={signUpData.email} onChange={handleSignUpChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" name="mobile" type="tel" maxLength={10} required value={signUpData.mobile} onChange={handleSignUpChange} />
                  <p className="text-xs text-muted-foreground">Must be a valid Indian mobile number</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} required value={signUpData.password} onChange={handleSignUpChange} />
                    <button type="button" className="absolute right-3 top-3" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium">Password must contain:</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {PASSWORD_REQUIREMENTS.map(req => (
                        <li key={req.id} className="flex items-center">
                          {passwordErrors[req.id] ? (
                            <X className="h-3 w-3 text-red-500 mr-1" />
                          ) : (
                            <Check className="h-3 w-3 text-green-500 mr-1" />
                          )}
                          {req.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={displayLoading}>
                  {displayLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>Enter your email to receive a password reset link</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="email" placeholder="your@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} disabled={displayLoading} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForgotPasswordDialog(false)} disabled={displayLoading}>Cancel</Button>
              <Button className="flex-1" disabled={displayLoading || !resetEmail} onClick={async () => {
                setIsLoading(true)
                const { error } = await supabase.auth.resetPasswordForEmail(resetEmail)
                setIsLoading(false)
                if (error) {
                  toast({ title: "Error", description: error.message, variant: "destructive" })
                } else {
                  toast({ title: "Email sent", description: "Check your inbox for a password reset link", variant: "default" })
                  setShowForgotPasswordDialog(false)
                }
              }}>
                {displayLoading ? "Sending..." : "Send Link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
