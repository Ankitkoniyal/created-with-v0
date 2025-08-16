"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  MessageSquare,
  MapPin,
  Calendar,
  BarChart3,
  PieChartIcon as RechartsPieChart,
  PhoneIcon as Cell,
  XIcon as XAxis,
  Axis3dIcon as YAxis,
  MapIcon as CartesianGrid,
  InfoIcon as Tooltip,
  ContainerIcon as ResponsiveContainer,
  PieChartIcon as Pie,
  Monitor,
  Smartphone,
  Globe,
  Activity,
  Clock,
} from "lucide-react"
import { AreaChart, Area, BarChart, Bar } from "recharts"

// Mock data for analytics
const monthlyData = [
  { month: "Jan", users: 1200, ads: 850, revenue: 12500, views: 45000 },
  { month: "Feb", users: 1350, ads: 920, revenue: 14200, views: 52000 },
  { month: "Mar", users: 1580, ads: 1100, revenue: 16800, views: 61000 },
  { month: "Apr", users: 1720, ads: 1250, revenue: 18900, views: 68000 },
  { month: "May", users: 1890, ads: 1380, revenue: 21200, views: 75000 },
  { month: "Jun", users: 2100, ads: 1520, revenue: 24500, views: 82000 },
]

const categoryData = [
  { name: "Electronics", value: 35, count: 2450, color: "#3B82F6" },
  { name: "Vehicles", value: 28, count: 1960, color: "#10B981" },
  { name: "Real Estate", value: 15, count: 1050, color: "#F59E0B" },
  { name: "Fashion", value: 12, count: 840, color: "#EF4444" },
  { name: "Furniture", value: 10, count: 700, color: "#8B5CF6" },
]

const deviceData = [
  { name: "Mobile", value: 68, color: "#3B82F6" },
  { name: "Desktop", value: 25, color: "#10B981" },
  { name: "Tablet", value: 7, color: "#F59E0B" },
]

const topLocations = [
  { city: "Toronto", province: "ON", users: 3250, ads: 2180, percentage: 22 },
  { city: "Vancouver", province: "BC", users: 2890, ads: 1950, percentage: 19 },
  { city: "Montreal", province: "QC", users: 2340, ads: 1620, percentage: 16 },
  { city: "Calgary", province: "AB", users: 1890, ads: 1280, percentage: 13 },
  { city: "Ottawa", province: "ON", users: 1560, ads: 1050, percentage: 11 },
]

const recentActivity = [
  { type: "user_signup", message: "New user registered from Toronto", time: "2 minutes ago", icon: Users },
  { type: "ad_posted", message: "iPhone 15 Pro listed in Electronics", time: "5 minutes ago", icon: Package },
  { type: "transaction", message: "Premium ad promotion purchased", time: "12 minutes ago", icon: DollarSign },
  { type: "message", message: "New inquiry on Honda Civic listing", time: "18 minutes ago", icon: MessageSquare },
  { type: "view", message: "High traffic spike in Vancouver area", time: "25 minutes ago", icon: Eye },
]

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("6months")
  const [selectedMetric, setSelectedMetric] = useState("users")

  const kpiData = [
    {
      title: "Total Users",
      value: "12,345",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Ads",
      value: "8,901",
      change: "+8.3%",
      trend: "up",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Monthly Revenue",
      value: "$24,500",
      change: "+15.7%",
      trend: "up",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Page Views",
      value: "82,000",
      change: "+9.2%",
      trend: "up",
      icon: Eye,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  const engagementMetrics = [
    { label: "Avg. Session Duration", value: "4m 32s", change: "+5.2%" },
    { label: "Bounce Rate", value: "32.1%", change: "-2.8%" },
    { label: "Pages per Session", value: "3.7", change: "+8.1%" },
    { label: "Conversion Rate", value: "2.4%", change: "+12.3%" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600">Comprehensive marketplace performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {kpi.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Growth Trends</span>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="ads">Ads</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey={selectedMetric} stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="text-sm text-gray-600">{category.name}</span>
                  <span className="text-sm font-medium ml-auto">{category.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topLocations.map((location, index) => (
                <div key={location.city} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {location.city}, {location.province}
                      </p>
                      <p className="text-sm text-gray-500">
                        {location.users} users • {location.ads} ads
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{location.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Device Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceData.map((device) => (
                <div key={device.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {device.name === "Mobile" && <Smartphone className="w-4 h-4 text-gray-600" />}
                      {device.name === "Desktop" && <Monitor className="w-4 h-4 text-gray-600" />}
                      {device.name === "Tablet" && <Globe className="w-4 h-4 text-gray-600" />}
                      <span className="text-sm font-medium">{device.name}</span>
                    </div>
                    <span className="text-sm font-bold">{device.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${device.value}%`, backgroundColor: device.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagementMetrics.map((metric) => (
                <div key={metric.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">{metric.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real-time Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Real-time Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">98.5%</p>
              <p className="text-sm text-gray-600">User Satisfaction</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">156%</p>
              <p className="text-sm text-gray-600">Growth Rate</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">89.2%</p>
              <p className="text-sm text-gray-600">Ad Success Rate</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">24/7</p>
              <p className="text-sm text-gray-600">Platform Uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
