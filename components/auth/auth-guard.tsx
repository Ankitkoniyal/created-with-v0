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
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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

    if (requireAuth && !user && !isPublicPage) {
      // Clean the current path for redirect
      const cleanPath = pathname.split('?')[0]
      const redirectUrl = `/auth/login?redirectedFrom=${encodeURIComponent(cleanPath)}`
      router.push(redirectUrl)
    }

    // Redirect authenticated users away from auth pages
    if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
      router.push('/dashboard')
    }
  }, [isClient, user, isLoading, requireAuth, router, pathname])

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
