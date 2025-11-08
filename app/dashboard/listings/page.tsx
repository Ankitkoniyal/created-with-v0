import { Suspense } from "react"
import { MyListings } from "@/components/dashboard/my-listings"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AuthGuard } from "@/components/auth/auth-guard"
import { LoadingSpinner } from "@/components/ui/loading-spinner" // You might need to create this

export default function ListingsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                   <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <DashboardNav />
            </div>
            <div className="lg:col-span-3">
              <Suspense fallback={<LoadingFallback />}>
                <MyListings />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
