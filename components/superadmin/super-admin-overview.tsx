"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Database,
  Shield,
  DollarSign,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Crown,
  Settings,
} from "lucide-react"

const systemStats = [
  {
    title: "Total Users",
    value: "12,345",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Database Size",
    value: "2.4 GB",
    change: "+5%",
    trend: "up",
    icon: Database,
    color: "text-green-600",
  },
  {
    title: "Security Alerts",
    value: "3",
    change: "-50%",
    trend: "down",
    icon: Shield,
    color: "text-red-600",
  },
  {
    title: "Total Revenue",
    value: "$125,678",
    change: "+28%",
    trend: "up",
    icon: DollarSign,
    color: "text-purple-600",
  },
]

const systemHealth = [
  { name: "Server Status", status: "healthy", value: "99.9%" },
  { name: "Database", status: "healthy", value: "Online" },
  { name: "CDN", status: "healthy", value: "Active" },
  { name: "Backup", status: "warning", value: "2h ago" },
]

export function SuperAdminOverview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Crown className="w-8 h-8 text-red-600" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600">Complete system control and monitoring</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            System Logs
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700">
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-red-600" />
              System Health
            </h3>
            <Badge variant="outline" className="text-green-600 border-green-600">
              All Systems Operational
            </Badge>
          </div>
          <div className="space-y-4">
            {systemHealth.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {item.status === "healthy" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <span
                  className={`text-sm font-medium ${item.status === "healthy" ? "text-green-600" : "text-yellow-600"}`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Critical Actions</h3>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Database className="w-4 h-4 mr-2" />
              Backup Database Now
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Shield className="w-4 h-4 mr-2" />
              Security Scan
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Users className="w-4 h-4 mr-2" />
              Bulk User Management
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency Maintenance Mode
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
