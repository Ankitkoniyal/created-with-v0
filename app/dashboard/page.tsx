import { Suspense } from "react"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Ads</h1>
            <p className="text-muted-foreground">Manage your listings and account</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <DashboardNav />
            </div>
            <div className="lg:col-span-3">
              <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <span className="sr-only">Loading...</span>
                </div>
              }>
                <DashboardOverview />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
