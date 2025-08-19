"use client"

import type React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Shield, AlertTriangle } from "lucide-react"

interface SuperAdminGuardProps {
  children: React.ReactNode
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isCheckingRole, setIsCheckingRole] = useState(true)

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsCheckingRole(false)
        return
      }

      try {
        const supabase = createClient()

        const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching user role:", error)
          setUserRole("user")
        } else {
          setUserRole(profile?.role || "user")
        }
      } catch (error) {
        console.error("Error checking user role:", error)
        setUserRole("user")
      } finally {
        setIsCheckingRole(false)
      }
    }

    checkUserRole()
  }, [user])

  useEffect(() => {
    if (!isLoading && !isCheckingRole) {
      if (!user) {
        router.push("/auth/login")
      } else if (userRole && userRole !== "super_admin") {
        router.push("/")
      }
    }
  }, [user, userRole, isLoading, isCheckingRole, router])

  if (isLoading || isCheckingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to access this area.</p>
        </div>
      </div>
    )
  }

  if (userRole !== "super_admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the admin dashboard. Only super administrators can access this area.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
