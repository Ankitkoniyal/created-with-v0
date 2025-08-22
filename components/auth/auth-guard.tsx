"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  console.log("[v0] AuthGuard - user:", user, "isLoading:", isLoading, "requireAuth:", requireAuth)

  useEffect(() => {
    console.log("[v0] AuthGuard useEffect - checking redirect conditions")
    if (!isLoading && requireAuth && !user) {
      console.log("[v0] AuthGuard - redirecting to login")
      router.push("/auth/login")
    }
  }, [user, isLoading, requireAuth, router])

  if (isLoading) {
    console.log("[v0] AuthGuard - showing loading state")
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
    console.log("[v0] AuthGuard - user not authenticated, returning null")
    return null
  }

  console.log("[v0] AuthGuard - rendering children")
  return <>{children}</>
}
