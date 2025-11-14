import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1 lg:pr-2">
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
