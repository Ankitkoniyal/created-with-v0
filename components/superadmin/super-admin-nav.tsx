"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Crown,
  Settings,
  Users,
  Database,
  Shield,
  BarChart3,
  FileText,
  Globe,
  DollarSign,
  Search,
  LogOut,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const superAdminNavItems = [
  {
    title: "Overview",
    href: "/superadmin",
    icon: BarChart3,
    badge: null,
  },
  {
    title: "System Settings",
    href: "/superadmin/system",
    icon: Settings,
    badge: null,
  },
  {
    title: "User Management",
    href: "/superadmin/users",
    icon: Users,
    badge: "1,234",
  },
  {
    title: "Database",
    href: "/superadmin/database",
    icon: Database,
    badge: null,
  },
  {
    title: "Security",
    href: "/superadmin/security",
    icon: Shield,
    badge: "3",
  },
  {
    title: "Content Control",
    href: "/superadmin/content",
    icon: FileText,
    badge: "45",
  },
  {
    title: "Site Configuration",
    href: "/superadmin/config",
    icon: Globe,
    badge: null,
  },
  {
    title: "Revenue",
    href: "/superadmin/revenue",
    icon: DollarSign,
    badge: null,
  },
]

export function SuperAdminNav() {
  const pathname = usePathname()

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Website Owner</h2>
          <p className="text-sm text-gray-500">Super Admin Panel</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search system functions..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <nav className="space-y-2">
        {superAdminNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-red-100 text-red-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 pt-4 border-t">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Owner Actions</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Backup Database
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            System Maintenance
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </Card>
  )
}
