import { AdminNav } from "@/components/admin/admin-nav"
import { WebsiteSettings } from "@/components/admin/website-settings"

export default function AdminSettingsPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
      <div className="lg:col-span-1">
        <AdminNav />
      </div>

      <div className="lg:col-span-3">
        <WebsiteSettings />
      </div>
    </div>
  )
}
