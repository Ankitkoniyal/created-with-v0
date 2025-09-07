"use client"

import type React from "react"
import { Suspense } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

// Wrap the main component with Suspense
export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AuthGuardContent requireAuth={requireAuth}>
        {children}
      </AuthGuardContent>
    </Suspense>
  )
}

// Create a separate component for the content that uses useSearchParams
function AuthGuardContent({ children, requireAuth }: AuthGuardProps) {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname() // Added to detect current page

  useEffect(() => {
    // Don't redirect if:
    // 1. Still loading user data
    // 2. Auth is not required for this page
    // 3. User is already logged in
    if (isLoading || !requireAuth || user) return

    const currentPath = window.location.pathname + window.location.search
    
    // List of pages that should NEVER redirect to login
    const publicPages = [
      '/', // Homepage
      '/auth/login',
      '/auth/signup', 
      '/auth/callback',
      '/auth/update-password',
      '/product/',
      '/category/',
      '/search',
      '/seller/'
    ]

    // Check if current page is public
    const isPublicPage = publicPages.some(publicPath => 
      currentPath.startsWith(publicPath)
    )

    // Only redirect if we're NOT on a public page
    if (!isPublicPage) {
      const cleanPath = currentPath.replace(/[?&]redirectedFrom=[^&]*/, "")
      router.push(`/auth/login?redirectedFrom=${encodeURIComponent(cleanPath)}`)
    }
  }, [user, isLoading, requireAuth, router, pathname])

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

  if (requireAuth && !user) {
    // Show loading state instead of immediate redirect
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
