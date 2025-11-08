import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const startTime = Date.now()

    // Check database connectivity
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })

    const dbResponseTime = Date.now() - startTime

    if (dbError) {
      return NextResponse.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          checks: {
            database: { status: "fail", error: dbError.message, responseTime: dbResponseTime },
            memory: {
              used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            },
          },
        },
        { status: 503 },
      )
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: { status: "pass", responseTime: dbResponseTime },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime?.() ?? 0,
        checks: {
          database: {
            status: "fail",
            responseTime: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          },
        },
      },
      { status: 503 },
    )
  }
}
