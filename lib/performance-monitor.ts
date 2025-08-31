interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  userId?: string
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000

  recordMetric(name: string, value: number, userId?: string, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      userId,
      metadata,
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log significant performance issues
    if (this.isSlowOperation(name, value)) {
      console.warn(`Slow operation detected: ${name} took ${value}ms`, metadata)
    }
  }

  private isSlowOperation(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      database_query: 1000,
      api_request: 2000,
      image_upload: 5000,
      page_load: 3000,
    }

    return value > (thresholds[name] || 2000)
  }

  getMetrics(name?: string, limit = 100): PerformanceMetric[] {
    const filtered = name ? this.metrics.filter((m) => m.name === name) : this.metrics
    return filtered.slice(-limit)
  }

  getAverageMetric(name: string, timeWindow = 300000): number {
    // 5 minutes
    const cutoff = Date.now() - timeWindow
    const recentMetrics = this.metrics.filter((m) => m.name === name && m.timestamp > cutoff)

    if (recentMetrics.length === 0) return 0

    const sum = recentMetrics.reduce((acc, m) => acc + m.value, 0)
    return sum / recentMetrics.length
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Helper function to measure async operations
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  userId?: string,
  metadata?: Record<string, any>,
): Promise<T> {
  const start = Date.now()
  try {
    const result = await operation()
    performanceMonitor.recordMetric(name, Date.now() - start, userId, metadata)
    return result
  } catch (error) {
    performanceMonitor.recordMetric(name, Date.now() - start, userId, {
      ...metadata,
      error: true,
    })
    throw error
  }
}
