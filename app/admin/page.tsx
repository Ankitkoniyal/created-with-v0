import { AdminNav } from "@/components/admin/admin-nav"
import { AdminOverview } from "@/components/admin/admin-overview"

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
      <div className="lg:col-span-1">
        <AdminNav />
      </div>

      <div className="lg:col-span-3">
        <AdminOverview />
      </div>
    </div>
  )
}
