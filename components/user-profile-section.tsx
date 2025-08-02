// components/user-profile-section.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Phone, Mail, User, ShieldCheck } from "lucide-react"

interface User {
  id: string
  full_name: string | null
  email: string | null
  mobile: string | null // Changed from phone to mobile
}

interface UserProfileSectionProps {
  user: User
}

export function UserProfileSection({ user }: UserProfileSectionProps) {
  const [showContact, setShowContact] = useState(false)

  if (!user) return null

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <User className="h-4 w-4 mr-2 text-gray-500" />
          Seller Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-2xl font-bold">{user.full_name || "Anonymous"}</div>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <ShieldCheck className="h-4 w-4 mr-1 text-green-500" />
          Verified User
        </div>
        <Separator className="my-4" />

        <Dialog open={showContact} onOpenChange={setShowContact}>
          <DialogTrigger asChild>
            <Button className="w-full">Show Contact Details</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Contact Seller</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center space-x-4">
                <Phone className="h-5 w-5 text-gray-500" />
                <Label htmlFor="mobile" className="text-right">
                  Phone
                </Label>
                <span className="text-sm font-medium">{user.mobile || "Not provided"}</span>
              </div>
              <div className="flex items-center space-x-4">
                <Mail className="h-5 w-5 text-gray-500" />
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <span className="text-sm font-medium">{user.email || "Not provided"}</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowContact(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}