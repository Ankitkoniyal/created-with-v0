import type React from "react"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">{children}</div>
    </AdminGuard>
  )
}
