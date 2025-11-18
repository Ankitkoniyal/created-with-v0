"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { SuperAdminNav } from "@/components/superadmin/super-admin-nav"
import { SuperAdminOverview } from "@/components/superadmin/super-admin-overview"
import AdsManagement from "@/components/superadmin/ads-management"
import UserManagement from "@/components/superadmin/user-management"
import { PendingReview } from "@/components/superadmin/pending-review"
import { ReportedAds } from "@/components/superadmin/reported-ads"
import { CategoriesManagement } from "@/components/superadmin/categories-management"
import { Analytics } from "@/components/superadmin/analytics"
import { Settings } from "@/components/superadmin/settings"
import { LocalitiesManagement } from "@/components/superadmin/localities-management"
import { Moderation } from "@/components/superadmin/moderation"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface DashboardStats {
  totalUsers: number
  totalAds: number
  activeAds: number
  pendingReview: number
  reportedAds: number
  newUsersToday: number
  newAdsToday: number
}

const VALID_VIEWS = [
  "overview",
  "ads",
  "pending",
  "reported",
  "users",
  "categories",
  "localities",
  "moderation",
  "analytics",
  "settings",
]

function SuperAdminPageContent() {
  const searchParams = useSearchParams()
  const initialView = useMemo(() => {
    const param = searchParams.get("view")
    return param && VALID_VIEWS.includes(param) ? param : "overview"
  }, [searchParams])

  const [activeView, setActiveView] = useState(initialView)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAds: 0,
    activeAds: 0,
    pendingReview: 0,
    reportedAds: 0,
    newUsersToday: 0,
    newAdsToday: 0
  })
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Wait for auth to finish loading before checking access
    if (isLoading) {
      return
    }
    checkSuperAdminAccess()
  }, [user, isLoading])

  useEffect(() => {
    const param = searchParams.get("view")
    if (param && VALID_VIEWS.includes(param) && param !== activeView) {
      setActiveView(param)
    }
    if (!param && activeView !== "overview") {
      setActiveView("overview")
    }
  }, [searchParams, activeView])

  const checkSuperAdminAccess = async () => {
    // Don't redirect if still loading
    if (isLoading) {
      return
    }
    
    if (!user) {
      router.replace("/auth/login")
      return
    }

    try {
      // Get fresh profile data
      const { data: freshProfile, error } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single()

      if (error || !freshProfile) {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Profile fetch error:", error)
        }
        router.replace("/dashboard")
        return
      }

      if (process.env.NODE_ENV === "development") {
        console.log("🛡️ Super Admin Access Check:", {
          email: freshProfile.email,
          role: freshProfile.role
        })
      }

      // Check both role AND specific email for security
      const isAuthorizedSuperAdmin = 
        freshProfile.role === 'super_admin' && 
        freshProfile.email === "ankit.koniyal000@gmail.com"

      if (!isAuthorizedSuperAdmin) {
        if (process.env.NODE_ENV === "development") {
          console.log("❌ Access denied - Not authorized super admin")
        }
        router.replace("/dashboard")
        return
      }

      if (process.env.NODE_ENV === "development") {
        console.log("✅ Access granted - Authorized super admin")
      }
      setIsAuthorized(true)

    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Super admin access check failed:", error)
      }
      router.replace("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (view: string, id?: string) => {
    try {
      const target = VALID_VIEWS.includes(view) ? view : "overview"
      setActiveView(target)
      const href = id 
        ? `/superadmin?view=${target}&id=${id}` 
        : target === "overview" 
          ? "/superadmin" 
          : `/superadmin?view=${target}`
      router.push(href)
    } catch (error) {
      // Silently handle navigation error
      // Fallback: just update the view state
      const target = VALID_VIEWS.includes(view) ? view : "overview"
      setActiveView(target)
    }
  }

  const renderActiveView = () => {
    if (loading || isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-white mt-2">Verifying super admin access...</p>
          </div>
        </div>
      )
    }

    if (!isAuthorized) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 text-lg">Access Denied</p>
            <p className="text-gray-400 mt-2">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    switch (activeView) {
      case "overview":
        return <SuperAdminOverview stats={stats} onNavigate={handleNavigate} />
      case "ads":
        return <AdsManagement />
      case "users":
        return <UserManagement />
      case "categories":
        return <CategoriesManagement />
      case "localities":
        return <LocalitiesManagement />
      case "moderation":
        return <Moderation />
      case "analytics":
        return <Analytics />
      case "settings":
        return <Settings />
      case "reported":
        return <ReportedAds />
      case "pending":
        return <PendingReview />
      default:
        return <SuperAdminOverview stats={stats} onNavigate={handleNavigate} />
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-white mt-2">Loading super admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-2">Access Denied</p>
          <p className="text-gray-400">You don't have permission to access the super admin dashboard.</p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to User Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <SuperAdminNav 
        stats={stats}
        onNavigate={handleNavigate}
        activeView={activeView}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderActiveView()}
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-white mt-2">Loading super admin panel...</p>
          </div>
        </div>
      }
    >
      <SuperAdminPageContent />
    </Suspense>
  )
}
