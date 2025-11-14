"use client"
import type React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button" // Add this import

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, profile, isLoading, isSuperAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [accountStatus, setAccountStatus] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check account status when user is loaded
  useEffect(() => {
    if (!user || isLoading) return

    const checkAccountStatus = async () => {
      try {
        // Check status from user metadata
        const metadataStatus = user.user_metadata?.account_status as string | undefined
        // Check status from profile
        const profileStatus = profile?.status as string | undefined
        
        const status = metadataStatus || profileStatus || "active"
        setAccountStatus(status)

        // If account is banned, suspended, or deleted, sign out and redirect
        if (status === "banned" || status === "suspended" || status === "deleted") {
          // Don't redirect if already on login page
          if (!pathname.startsWith('/auth/login')) {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            await supabase.auth.signOut()
            
            let errorMessage = "Your account has been restricted. Please contact support for resolution."
            if (status === "banned") {
              errorMessage = "Your account has been banned. Please contact support for resolution."
            } else if (status === "suspended") {
              errorMessage = "Your account has been suspended. Please contact support for resolution."
            } else if (status === "deleted") {
              errorMessage = "This account has been deleted. Please contact support for resolution."
            }
            
            router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
          }
        }
      } catch (error) {
        console.error("Error checking account status:", error)
      }
    }

    checkAccountStatus()
  }, [user, profile, isLoading, pathname, router])

  useEffect(() => {
    if (!isClient || isLoading) return

    // Public pages that don't require authentication
    const publicPages = [
      '/',
      '/auth/login',
      '/auth/signup', 
      '/auth/callback',
      '/auth/forgot-password',
      '/auth/update-password',
      '/products',
      '/categories',
      '/search',
      '/about',
      '/contact',
      '/product' // Add product pages as public
    ]

    const isPublicPage = publicPages.some(publicPath => 
      pathname === publicPath || pathname.startsWith(publicPath + '/')
    )

    // Block access if account is restricted
    if (requireAuth && user && accountStatus && ["banned", "suspended", "deleted"].includes(accountStatus)) {
      if (!pathname.startsWith('/auth/login')) {
        router.push('/auth/login')
      }
      return
    }

    if (requireAuth && !user && !isPublicPage) {
      // Clean the current path for redirect
      const cleanPath = pathname.split('?')[0]
      const redirectUrl = `/auth/login?redirectedFrom=${encodeURIComponent(cleanPath)}`
      router.push(redirectUrl)
    }

    // Redirect authenticated users away from auth pages (unless account is restricted)
    if (user && !accountStatus && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
      const redirectPath = isSuperAdmin ? '/superadmin' : '/dashboard'
      router.push(redirectPath)
    }
  }, [isClient, user, accountStatus, isLoading, isSuperAdmin, requireAuth, router, pathname])

  // Show loading state
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show access denied for protected routes
  if (requireAuth && !user) {
    const isAuthPage = pathname.startsWith('/auth/')
    
    if (isAuthPage) {
      return <>{children}</>
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access this page</p>
            <Button
              onClick={() => router.push(`/auth/login?redirectedFrom=${encodeURIComponent(pathname)}`)}
              className="bg-green-800 hover:bg-green-900 text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
