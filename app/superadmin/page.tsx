"use client"

export const runtime = 'nodejs'

import { useState, useEffect } from "react"
import { SuperAdminNav } from "@/components/superadmin/super-admin-nav"
import { SuperAdminOverview } from "@/components/superadmin/super-admin-overview"
import { AdsManagement } from "@/components/superadmin/ads-management"
import { PendingReview } from "@/components/superadmin/pending-review"
import { ReportedAds } from "@/components/superadmin/reported-ads"
import UserManagement from "@/components/superadmin/user-management"
import { CategoriesManagement } from "@/components/superadmin/categories-management"
import { LocalitiesManagement } from "@/components/superadmin/localities-management"
import { Analytics } from "@/components/superadmin/analytics"
import { Settings } from "@/components/superadmin/settings"
import { getSupabaseClient } from "@/lib/supabase/client"

type ActiveView = 
  | "overview" 
  | "ads" 
  | "pending" 
  | "reported" 
  | "users" 
  | "categories" 
  | "localities" 
  | "analytics" 
  | "settings";

export default function SuperAdminDashboard() {
  const [activeView, setActiveView] = useState<ActiveView>("overview");
  const [stats, setStats] = useState({
    totalAds: 0,
    activeAds: 0,
    pendingReview: 0,
    reportedAds: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const supabase = await getSupabaseClient()
      
      // Fetch all data in parallel
      const [
        usersResponse,
        productsResponse,
        pendingAdsResponse,
        reportedAdsResponse,
        activeAdsResponse
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('products').select('*', { count: 'exact' }),
        supabase.from('products').select('*', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('products').select('*', { count: 'exact' }).eq('status', 'reported'),
        supabase.from('products').select('*', { count: 'exact' }).eq('status', 'active')
      ])

      setStats({
        totalUsers: usersResponse.count || 0,
        totalAds: productsResponse.count || 0,
        activeAds: activeAdsResponse.count || 0,
        pendingReview: pendingAdsResponse.count || 0,
        reportedAds: reportedAdsResponse.count || 0,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigation = (view: ActiveView) => {
    setActiveView(view);
    if (view === "overview") {
      fetchDashboardData(); // Refresh data when returning to overview
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return <SuperAdminOverview stats={stats} />;
      case "ads":
        return <AdsManagement />;
      case "pending":
        return <PendingReview />;
      case "reported":
        return <ReportedAds />;
      case "users":
        return <UserManagement />;
      case "categories":
        return <CategoriesManagement />;
      case "localities":
        return <LocalitiesManagement />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
      default:
        return <SuperAdminOverview stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-900">
        <div className="w-72 bg-gray-900 p-6 flex flex-col border-r border-gray-700">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-700 mb-6" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <div key={i} className="h-10 animate-pulse rounded bg-gray-700" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <div className="h-10 w-64 animate-pulse rounded bg-gray-700 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <SuperAdminNav stats={stats} onNavigate={handleNavigation} activeView={activeView} />
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          {renderActiveView()}
        </div>
      </div>
    </div>
  )
}
