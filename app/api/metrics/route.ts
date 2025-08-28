import { NextResponse } from "next/server"
import { performanceMonitor } from "@/lib/performance-monitor"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get("metric")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    // Get performance metrics
    const metrics = performanceMonitor.getMetrics(metric || undefined, limit)

    // Get system metrics
    const supabase = createClient()
    const { data: productCount } = await supabase.from("products").select("count").single()

    const { data: userCount } = await supabase.from("profiles").select("count").single()

    return NextResponse.json({
      performance: metrics,
      system: {
        totalProducts: productCount?.count || 0,
        totalUsers: userCount?.count || 0,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
      averages: {
        databaseQuery: performanceMonitor.getAverageMetric("database_query"),
        apiRequest: performanceMonitor.getAverageMetric("api_request"),
        pageLoad: performanceMonitor.getAverageMetric("page_load"),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
