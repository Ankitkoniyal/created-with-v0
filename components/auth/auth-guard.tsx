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
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isLoading && requireAuth && (!user || !profile)) {
      const currentPath = window.location.pathname + window.location.search

      // Don't redirect if already on auth pages
      if (
        !currentPath.includes("/auth/login") &&
        !currentPath.includes("/auth/signup") &&
        !currentPath.includes("/auth/callback")
      ) {
        // Clear any existing redirectedFrom to prevent loops
        const cleanPath = currentPath.replace(/[?&]redirectedFrom=[^&]*/, "")
        router.push(`/auth/login?redirectedFrom=${encodeURIComponent(cleanPath)}`)
      }
    }
  }, [user, profile, isLoading, requireAuth, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && (!user || !profile)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
