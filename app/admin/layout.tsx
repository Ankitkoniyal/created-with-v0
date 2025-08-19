import type React from "react"
import { SuperAdminGuard } from "@/components/auth/super-admin-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SuperAdminGuard>
      <div className="min-h-screen bg-gray-50">{children}</div>
    </SuperAdminGuard>
  )
}
