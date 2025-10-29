import { createHealthCheckHandler } from '@/lib/api-wrapper'
import { getServiceClient } from '@/lib/supabase-service'

/**
 * GET /api/health
 * Health check endpoint for monitoring the API status
 *
 * Returns system health status including database connectivity
 */
export const GET = createHealthCheckHandler({
  // Database health check
  database: async () => {
    try {
      const supabase = getServiceClient()
      const { error } = await supabase.from('users').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  },

  // Memory usage check
  memory: async () => {
    const usage = process.memoryUsage()
    const heapUsedMB = usage.heapUsed / 1024 / 1024
    // Consider unhealthy if using more than 500MB heap
    return heapUsedMB < 500
  },

  // Event loop lag check
  eventLoop: async () => {
    const start = Date.now()
    await new Promise(resolve => setImmediate(resolve))
    const lag = Date.now() - start
    // Consider unhealthy if event loop lag exceeds 100ms
    return lag < 100
  }
})