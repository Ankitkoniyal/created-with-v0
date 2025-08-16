import { AdminNav } from "@/components/admin/admin-nav"
import { AdManagement } from "@/components/admin/ad-management"

export default function AdminAdsPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
      <div className="lg:col-span-1">
        <AdminNav />
      </div>

      <div className="lg:col-span-3">
        <AdManagement />
      </div>
    </div>
  )
}
