"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, Flag, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Eye, UserCheck } from "lucide-react"

const stats = [
  {
    title: "Total Users",
    value: "12,345",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Active Ads",
    value: "8,901",
    change: "+8%",
    trend: "up",
    icon: FileText,
    color: "text-green-600",
  },
  {
    title: "Pending Reports",
    value: "23",
    change: "-15%",
    trend: "down",
    icon: Flag,
    color: "text-red-600",
  },
  {
    title: "Revenue",
    value: "$45,678",
    change: "+25%",
    trend: "up",
    icon: DollarSign,
    color: "text-purple-600",
  },
]

const recentActivity = [
  {
    id: 1,
    type: "user_signup",
    message: "New user registered: john.doe@email.com",
    time: "2 minutes ago",
    status: "info",
  },
  {
    id: 2,
    type: "ad_reported",
    message: 'Ad "iPhone 15 Pro" reported for suspicious content',
    time: "15 minutes ago",
    status: "warning",
  },
  {
    id: 3,
    type: "ad_approved",
    message: 'Ad "Honda Civic 2020" approved and published',
    time: "1 hour ago",
    status: "success",
  },
  {
    id: 4,
    type: "user_banned",
    message: "User account suspended: spam.user@email.com",
    time: "2 hours ago",
    status: "error",
  },
]

const pendingApprovals = [
  {
    id: 1,
    title: "iPhone 15 Pro Max - Excellent Condition",
    user: "sarah.wilson@email.com",
    category: "Electronics",
    price: "$1,200",
    time: "30 minutes ago",
  },
  {
    id: 2,
    title: "2019 Honda Civic - Low Mileage",
    user: "mike.johnson@email.com",
    category: "Vehicles",
    price: "$18,500",
    time: "1 hour ago",
  },
  {
    id: 3,
    title: "Modern Sofa Set - Like New",
    user: "lisa.brown@email.com",
    category: "Furniture",
    price: "$800",
    time: "2 hours ago",
  },
]

export function AdminOverview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your marketplace</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View Site
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <UserCheck className="w-4 h-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6">
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
                <TrendingUp className={`w-4 h-4 mr-1 ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`} />
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
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === "success"
                      ? "bg-green-500"
                      : activity.status === "warning"
                        ? "bg-yellow-500"
                        : activity.status === "error"
                          ? "bg-red-500"
                          : "bg-blue-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
            <Badge variant="secondary">{pendingApprovals.length}</Badge>
          </div>
          <div className="space-y-4">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{item.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-medium text-green-600">{item.price}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-3">
                  <Button size="sm" variant="outline" className="text-xs bg-transparent">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 hover:text-red-700 bg-transparent"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
