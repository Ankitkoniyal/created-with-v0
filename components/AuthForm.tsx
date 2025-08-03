// components/AuthForm.tsx
"use client"

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { resetPasswordForEmail } from '@/lib/auth';
import { Eye, EyeOff } from 'lucide-react';

export function AuthForm() {
  const { signIn, signUp, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  
  // State for form inputs
  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async (formData: FormData) => {
    setIsLoading(true);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn(email, password);

    if (result.success) {
      toast({
        title: "Success",
        description: "Signed in successfully!",
        variant: "default",
      });
      router.push("/");
    } else {
      let errorMessage = "Failed to sign in. Please check your credentials.";
      if (result.error) {
        console.error("Sign-in error:", result.error);
        errorMessage = result.error;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleSignUpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordError("");

    const { fullName, email, mobile, password } = signUpData;

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      setIsLoading(false);
      return;
    }
    
    const result = await signUp(email, password, fullName, mobile);

    if (result.success) {
      toast({
        title: "Success",
        description: "Account created! Please check your email for confirmation.",
      });
      router.push("/");
    } else {
      let errorMessage = "Failed to create account.";
      if (result.error?.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Please sign in.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async () => { /* ... (Same as before) ... */ };
  const displayLoading = authLoading || isLoading;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Marketplace</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
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
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={displayLoading}>
                  {displayLoading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="text-center mt-2">
                  <Button variant="link" size="sm" onClick={() => setShowForgotPasswordDialog(true)} disabled={displayLoading}>
                    Forgot Password?
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" type="text" placeholder="John Doe" required value={signUpData.fullName} onChange={handleSignUpChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" required value={signUpData.email} onChange={handleSignUpChange} />
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
                    value={signUpData.mobile} 
                    onChange={handleSignUpChange}
                  />
                  <small className="text-xs text-gray-500">Enter 10-digit mobile number</small>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={signUpData.password} 
                      onChange={handleSignUpChange} 
                    />
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                  {passwordError && <p className="text-sm text-red-500 mt-1">{passwordError}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Your password must be at least 8 characters long and contain:
                    an uppercase letter, a lowercase letter, a number, and a special character (e.g., `P@ssword1`).
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={displayLoading}>
                  {displayLoading ? "Processing..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a password reset link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              disabled={displayLoading}
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowForgotPasswordDialog(false)} variant="outline" className="flex-1" disabled={displayLoading}>
                Cancel
              </Button>
              <Button onClick={handlePasswordReset} className="flex-1" disabled={displayLoading}>
                {displayLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}