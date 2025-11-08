import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <DashboardNav />
            </div>
            <div className="lg:col-span-3">
              <DashboardOverview />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
