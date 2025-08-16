import { AdminNav } from "@/components/admin/admin-nav"
import { UserManagement } from "@/components/admin/user-management"

export default function AdminUsersPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
      <div className="lg:col-span-1">
        <AdminNav />
      </div>

      <div className="lg:col-span-3">
        <UserManagement />
      </div>
    </div>
  )
}
