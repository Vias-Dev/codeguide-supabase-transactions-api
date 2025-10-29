import type { NextRequest, NextResponse } from 'next/server'
import { Logger } from './error-handler'

/**
 * Request timing information
 */
interface RequestTiming {
  startTime: number
  endTime?: number
  duration?: number
}

/**
 * Request context for logging
 */
interface RequestContext {
  requestId: string
  method: string
  url: string
  userAgent?: string
  ip?: string
  userId?: string
  apiKey?: string
}

/**
 * Generates a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Extracts client information from request
 */
function extractClientInfo(request: NextRequest): {
  userAgent?: string
  ip?: string
} {
  const userAgent = request.headers.get('user-agent') || undefined
  const ip = request.headers.get('x-forwarded-for') ||
           request.headers.get('x-real-ip') ||
           request.ip ||
           undefined

  return { userAgent, ip }
}

/**
 * Extracts user context from request headers
 */
function extractUserContext(request: NextRequest): {
  userId?: string
  apiKey?: string
} {
  const userId = request.headers.get('x-user-id') || undefined
  const apiKey = request.headers.get('x-api-key') || undefined

  return { userId, apiKey }
}

/**
 * Starts request timing
 */
export function startRequestTiming(): RequestTiming {
  return {
    startTime: Date.now()
  }
}

/**
 * Ends request timing and returns duration
 */
export function endRequestTiming(timing: RequestTiming): RequestTiming {
  timing.endTime = Date.now()
  timing.duration = timing.endTime - timing.startTime
  return timing
}

/**
 * Logs incoming request
 */
export function logIncomingRequest(
  request: NextRequest,
  timing: RequestTiming
): RequestContext {
  const requestId = generateRequestId()
  const { userAgent, ip } = extractClientInfo(request)
  const { userId, apiKey } = extractUserContext(request)

  const context: RequestContext = {
    requestId,
    method: request.method,
    url: request.url,
    userAgent,
    ip,
    userId,
    apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : undefined
  }

  // Add request ID to headers for downstream use
  request.headers.set('x-request-id', requestId)

  Logger.info(`Incoming ${request.method} request`, request, {
    context,
    timing: { startTime: timing.startTime }
  })

  return context
}

/**
 * Logs successful response
 */
export function logSuccessResponse(
  request: NextRequest,
  context: RequestContext,
  timing: RequestTiming,
  response?: NextResponse | Response
): void {
  const statusCode = response?.status || 200

  Logger.info(`Request completed successfully`, request, {
    context,
    timing: {
      startTime: timing.startTime,
      endTime: timing.endTime,
      duration: timing.duration
    },
    response: {
      statusCode,
      contentType: response?.headers.get('content-type')
    }
  })
}

/**
 * Logs error response
 */
export function logErrorResponse(
  request: NextRequest,
  context: RequestContext,
  timing: RequestTiming,
  error: any,
  statusCode: number
): void {
  Logger.error(`Request failed with error`, error, request, {
    context,
    timing: {
      startTime: timing.startTime,
      endTime: timing.endTime,
      duration: timing.duration
    },
    response: {
      statusCode,
      error: error instanceof Error ? error.message : error
    }
  })
}

/**
 * Performance monitoring for slow requests
 */
export function checkSlowRequest(
  timing: RequestTiming,
  threshold: number = 1000 // 1 second default
): boolean {
  const duration = timing.duration || 0
  return duration > threshold
}

/**
 * Logs slow requests for performance monitoring
 */
export function logSlowRequest(
  request: NextRequest,
  context: RequestContext,
  timing: RequestTiming,
  threshold: number = 1000
): void {
  if (checkSlowRequest(timing, threshold)) {
    Logger.warn(`Slow request detected`, request, {
      context,
      timing: {
        duration: timing.duration,
        threshold
      }
    })
  }
}

/**
 * Request logging middleware function
 * This can be used in API routes to log request/response lifecycle
 */
export function withRequestLogger(
  handler: (request: NextRequest) => Promise<Response | NextResponse>
) {
  return async (request: NextRequest): Promise<Response | NextResponse> => {
    const timing = startRequestTiming()
    const context = logIncomingRequest(request, timing)

    try {
      const response = await handler(request)
      endRequestTiming(timing)

      logSuccessResponse(request, context, timing, response)
      logSlowRequest(request, context, timing)

      return response
    } catch (error) {
      endRequestTiming(timing)

      // Don't log the error here - it will be logged by the error handler
      logErrorResponse(request, context, timing, error, 500)

      throw error
    }
  }
}

/**
 * API performance metrics collector
 */
export class PerformanceMetrics {
  private static metrics: Map<string, {
    count: number
    totalDuration: number
    minDuration: number
    maxDuration: number
    errorCount: number
  }> = new Map()

  static recordRequest(
    endpoint: string,
    duration: number,
    success: boolean = true
  ): void {
    const existing = this.metrics.get(endpoint) || {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errorCount: 0
    }

    const updated = {
      count: existing.count + 1,
      totalDuration: existing.totalDuration + duration,
      minDuration: Math.min(existing.minDuration, duration),
      maxDuration: Math.max(existing.maxDuration, duration),
      errorCount: existing.errorCount + (success ? 0 : 1)
    }

    this.metrics.set(endpoint, updated)

    // Log performance warnings
    if (duration > 2000) { // 2 seconds
      Logger.warn(`Slow API response`, undefined, {
        endpoint,
        duration,
        averageDuration: updated.totalDuration / updated.count
      })
    }
  }

  static getMetrics(): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [endpoint, metrics] of this.metrics.entries()) {
      result[endpoint] = {
        ...metrics,
        averageDuration: metrics.totalDuration / metrics.count,
        errorRate: (metrics.errorCount / metrics.count) * 100
      }
    }

    return result
  }

  static resetMetrics(): void {
    this.metrics.clear()
  }
}