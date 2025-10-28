import { createGetHandler } from '@/lib/api-wrapper'
import { PerformanceMetrics } from '@/lib/request-logger'

/**
 * GET /api/metrics
 * Returns API performance metrics for monitoring
 * This endpoint provides insights into API performance and usage patterns
 *
 * Requires authentication for security
 */
export const GET = createGetHandler(async () => {
  const metrics = PerformanceMetrics.getMetrics()

  // Calculate system-wide statistics
  let totalRequests = 0
  let totalErrors = 0
  let totalDuration = 0
  let slowRequests = 0

  for (const [endpoint, data] of Object.entries(metrics)) {
    totalRequests += data.count
    totalErrors += data.errorCount
    totalDuration += data.totalDuration
    if (data.averageDuration > 1000) { // > 1 second
      slowRequests += data.count
    }
  }

  const overallErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
  const overallAverageDuration = totalRequests > 0 ? totalDuration / totalRequests : 0
  const slowRequestRate = totalRequests > 0 ? (slowRequests / totalRequests) * 100 : 0

  return {
    success: true,
    data: {
      summary: {
        totalRequests,
        totalErrors,
        overallErrorRate: Math.round(overallErrorRate * 100) / 100,
        overallAverageDuration: Math.round(overallAverageDuration * 100) / 100,
        slowRequestRate: Math.round(slowRequestRate * 100) / 100
      },
      endpoints: metrics,
      systemInfo: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      }
    }
  }
})

/**
 * DELETE /api/metrics
 * Reset metrics (for testing/maintenance purposes)
 */
export const DELETE = createGetHandler(async () => {
  PerformanceMetrics.resetMetrics()

  return {
    success: true,
    data: {
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString()
    }
  }
})