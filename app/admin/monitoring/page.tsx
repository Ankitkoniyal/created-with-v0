"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Activity, Database, Users, ShoppingBag } from "lucide-react"
import { SuperAdminGuard } from "@/components/auth/super-admin-guard"
import { logger } from "@/lib/logger"

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
      const response = await fetch("/api/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      logger.error("Failed to fetch health:", error)
      // Set a fallback health status
      setHealth({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        checks: {
          database: { 
            status: "fail", 
            responseTime: 0, 
            error: error instanceof Error ? error.message : "Network error" 
          },
          memory: { used: 0, total: 0 },
        },
      })
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/metrics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        throw new Error(`Metrics fetch failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      logger.error("Failed to fetch metrics:", error)
      // Don't set metrics on error, let it remain null
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
    <SuperAdminGuard>
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
            {!health ? (
              <p>Loading health status...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={health.status === "healthy" ? "default" : "destructive"}>
                    {(health.status || "unhealthy").toString().toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Last checked: {new Date(health.timestamp || Date.now()).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Database */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Database
                    </h4>
                    <Badge variant={health?.checks?.database?.status === "pass" ? "default" : "destructive"}>
                      {health?.checks?.database?.status ?? "fail"}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Response: {health?.checks?.database?.responseTime ?? 0}ms
                    </p>
                    {health?.checks?.database?.error ? (
                      <p className="text-xs text-red-500 break-all">{health.checks.database.error}</p>
                    ) : null}
                  </div>

                  {/* Memory */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Memory Usage</h4>
                    <p className="text-sm">
                      {health?.checks?.memory?.used ?? 0}MB / {health?.checks?.memory?.total ?? 0}MB
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              ((health?.checks?.memory?.used ?? 0) / Math.max(1, health?.checks?.memory?.total ?? 1)) *
                                100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Uptime */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Uptime</h4>
                    <p className="text-sm">{health?.uptime ? Math.floor((health.uptime || 0) / 3600) : 0} hours</p>
                  </div>
                </div>
              </div>
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
    </SuperAdminGuard>
  )
}
