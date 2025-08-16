import { MyListings } from "@/components/dashboard/my-listings"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function ListingsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Ads</h1>{" "}
            {/* Updated from "My Listings" to "My Ads" */}
            <p className="text-muted-foreground">Manage your active and sold products</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <DashboardNav />
            </div>
            <div className="lg:col-span-3">
              <MyListings />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
