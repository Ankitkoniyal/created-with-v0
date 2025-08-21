"use client"

import { SuperAdminGuard } from "@/components/auth/super-admin-guard"
import { SuperAdminNav } from "@/components/superadmin/super-admin-nav"
import { SuperAdminOverview } from "@/components/superadmin/super-admin-overview"

export default function SuperAdminDashboard() {
  return (
    <SuperAdminGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          <div className="lg:col-span-1">
            <SuperAdminNav />
          </div>
          <div className="lg:col-span-3">
            <SuperAdminOverview />
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  )
}
