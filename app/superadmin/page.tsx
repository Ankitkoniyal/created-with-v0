// app/superadmin/page.tsx
"use client"

import { useState, useEffect } from "react"
import { SuperAdminNav } from "@/components/superadmin/super-admin-nav"
import { SuperAdminOverview } from "@/components/superadmin/super-admin-overview"
import { AdsManagement } from "@/components/superadmin/ads-management"
import UserManagement from "@/components/superadmin/user-management"
import { LocalitiesManagement } from "@/components/superadmin/localities-management"
import { ReportedAds } from "@/components/superadmin/reported-ads"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

interface DashboardStats {
  totalUsers: number
  totalAds: number
  activeAds: number
  pendingReview: number
  reportedAds: number
  newUsersToday: number
  newAdsToday: number
}

export default function SuperAdminPage() {
  const [activeView, setActiveView] = useState("overview")
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAds: 0,
    activeAds: 0,
    pendingReview: 0,
    reportedAds: 0,
    newUsersToday: 0,
    newAdsToday: 0
  })
  
  const { isAdmin, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !isAdmin) {
      router.push("/")
    }
  }, [user, isAdmin, router])

  const renderActiveView = () => {
    if (user && !isAdmin) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white">Loading...</div>
        </div>
      )
    }

    switch (activeView) {
      case "overview":
        return <SuperAdminOverview stats={stats} onNavigate={setActiveView} />
      case "ads":
        return <AdsManagement />
      case "users":
        return <UserManagement />
      case "localities":
        return <LocalitiesManagement />
      case "reported":
        return <ReportedAds />
      case "pending":
        return <PendingReview />
      default:
        return <SuperAdminOverview stats={stats} onNavigate={setActiveView} />
    }
  }

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <SuperAdminNav 
        stats={stats}
        onNavigate={setActiveView}
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

function PendingReview() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Pending Review</h1>
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400">Pending ads waiting for approval will appear here.</p>
      </div>
    </div>
  )
}
