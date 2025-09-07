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

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthGuardContent requireAuth={requireAuth}>
        {children}
      </AuthGuardContent>
    </Suspense>
  )
}

function AuthGuardContent({ children, requireAuth }: AuthGuardProps) {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading || !requireAuth || user) return

    // Use ONLY Next.js hooks - no window.location!
    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
    
    const publicPages = [
      '/',
      '/auth/login',
      '/auth/signup', 
      '/auth/callback',
      '/auth/update-password',
      '/product/',
      '/category/',
      '/search',
      '/seller/'
    ]

    const isPublicPage = publicPages.some(publicPath => 
      currentPath.startsWith(publicPath)
    )

    if (!isPublicPage) {
      const cleanPath = currentPath.replace(/[?&]redirectedFrom=[^&]*/, "")
      router.push(`/auth/login?redirectedFrom=${encodeURIComponent(cleanPath)}`)
    }
  }, [user, isLoading, requireAuth, router, pathname, searchParams])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (requireAuth && !user) {
    return <LoadingSpinner message="Checking authentication..." />
  }

  return <>{children}</>
}

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
