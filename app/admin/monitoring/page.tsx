"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Activity, Database, Users, ShoppingBag } from "lucide-react"

interface HealthStatus {
  status: "healthy" | "unhealthy"
  timestamp: string
  uptime?: number
  checks: {
    database: { status: "pass" | "fail"; responseTime: number; error?: string }
    memory: { used: number; total: number }
  }
}

interface SystemMetrics {
  system: {
    totalProducts: number
    totalUsers: number
    uptime: number
    memory: { used: number; total: number }
  }
  averages: {
    databaseQuery: number
    apiRequest: number
    pageLoad: number
  }
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = async () => {
    try {
      const response = await fetch("/api/health")
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error("Failed to fetch health:", error)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/metrics")
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
    }
  }

  const refresh = async () => {
    setLoading(true)
    await Promise.all([fetchHealth(), fetchMetrics()])
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <Button onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {health ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={health.status === "healthy" ? "default" : "destructive"}>
                  {health.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Last checked: {new Date(health.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database
                  </h4>
                  <Badge variant={health.checks.database.status === "pass" ? "default" : "destructive"}>
                    {health.checks.database.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground">Response: {health.checks.database.responseTime}ms</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Memory Usage</h4>
                  <p className="text-sm">
                    {health.checks.memory.used}MB / {health.checks.memory.total}MB
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(health.checks.memory.used / health.checks.memory.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Uptime</h4>
                  <p className="text-sm">{health.uptime ? Math.floor(health.uptime / 3600) : 0} hours</p>
                </div>
              </div>
            </div>
          ) : (
            <p>Loading health status...</p>
          )}
        </CardContent>
      </Card>

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.system.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.system.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg DB Query</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.averages.databaseQuery)}ms</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.averages.apiRequest)}ms</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
