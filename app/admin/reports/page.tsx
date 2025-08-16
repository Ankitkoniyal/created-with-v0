import { AdminNav } from "@/components/admin/admin-nav"
import { ContentModeration } from "@/components/admin/content-moderation"

export default function AdminReportsPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
      <div className="lg:col-span-1">
        <AdminNav />
      </div>

      <div className="lg:col-span-3">
        <ContentModeration />
      </div>
    </div>
  )
}
