"use client"

import type React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  console.log("[FIXED] AuthGuard - user:", user, "isLoading:", isLoading, "requireAuth:", requireAuth)

  useEffect(() => {
    console.log("[FIXED] AuthGuard useEffect - checking redirect conditions")
    if (!isLoading && requireAuth && !user) {
      // Get the current path and preserve it for redirect after login
      const currentPath = window.location.pathname + window.location.search
      console.log("[FIXED] AuthGuard - redirecting to login with return url:", currentPath)
      
      // Redirect to login with the return URL
      router.push(`/auth/login?redirectedFrom=${encodeURIComponent(currentPath)}`)
    }
  }, [user, isLoading, requireAuth, router])

  if (isLoading) {
    console.log("[FIXED] AuthGuard - showing loading state")
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    console.log("[FIXED] AuthGuard - user not authenticated, returning null")
    return null
  }

  console.log("[FIXED] AuthGuard - rendering children")
  return <>{children}</>
}
