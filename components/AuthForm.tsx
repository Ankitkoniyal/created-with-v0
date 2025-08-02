// AuthForm.tsx
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

export function AuthForm() {
  const { signIn, signUp, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  
  // New state for validation errors
  const [passwordError, setPasswordError] = useState("");

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
      toast({
        title: "Error",
        description: result.error || "Failed to sign in. Please check your credentials.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleSignUpSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setPasswordError(""); // Reset previous error

    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const mobile = formData.get("mobile") as string;
    const password = formData.get("password") as string;

    // Mobile Number Validation
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // NEW Password Policy Validation
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
        description: "Account created successfully! Please check your email for confirmation.",
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

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ title: "Error", description: "Please enter your email address.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    const { error } = await resetPasswordForEmail(resetEmail);

    if (error) {
        toast({
            title: "Error",
            description: "Failed to send reset email. Please try again.",
            variant: "destructive"
        });
    } else {
        toast({
            title: "Success",
            description: "Password reset link has been sent to your email.",
        });
        setShowForgotPasswordDialog(false);
    }
    setIsLoading(false);
  };

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
                  <Input id="password" name="password" type="password" required />
                  {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
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