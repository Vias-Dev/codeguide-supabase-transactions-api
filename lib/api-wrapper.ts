import type { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, ErrorFactory } from './error-handler'
import { withRequestLogger, PerformanceMetrics, startRequestTiming, endRequestTiming } from './request-logger'
import { createApiRouteClient } from './api-route-helpers'

/**
 * Enhanced API handler options
 */
interface ApiHandlerOptions {
  requireAuth?: boolean
  validateUser?: boolean
  rateLimit?: {
    requests: number
    windowMs: number
  }
  timeout?: number
  enableMetrics?: boolean
}

/**
 * Request context object passed to handlers
 */
interface ApiContext {
  request: NextRequest
  userId?: string
  supabase: any
  timing: {
    startTime: number
    duration?: number
  }
}

/**
 * Enhanced API handler function type
 */
type ApiHandlerFunction<T = any> = (
  context: ApiContext
) => Promise<T | NextResponse | Response>

/**
 * Creates an enhanced API route handler with comprehensive error handling, logging, and metrics
 */
export function createApiHandler<T = any>(
  handler: ApiHandlerFunction<T>,
  options: ApiHandlerOptions = {}
) {
  const {
    requireAuth = true,
    validateUser = true,
    rateLimit,
    timeout = 30000, // 30 seconds default
    enableMetrics = true
  } = options

  return withRequestLogger(async (request: NextRequest): Promise<Response | NextResponse> => {
    const timing = startRequestTiming()

    try {
      // Create base context
      const context: ApiContext = {
        request,
        supabase: createApiRouteClient(request),
        timing: {
          startTime: timing.startTime
        }
      }

      // Handle authentication if required
      if (requireAuth) {
        const userId = request.headers.get('x-user-id')
        const apiKeyValidated = request.headers.get('x-api-key-validated')

        if (apiKeyValidated !== 'true' || !userId) {
          throw ErrorFactory.unauthorized('Authentication required')
        }

        context.userId = userId

        // Validate user status if required
        if (validateUser) {
          const { data: user, error } = await context.supabase
            .from('users')
            .select('id, banned, verified')
            .eq('id', userId)
            .single()

          if (error || !user) {
            throw ErrorFactory.notFound('User account not found')
          }

          if (user.banned) {
            throw ErrorFactory.forbidden('Account is suspended')
          }

          if (!user.verified) {
            throw ErrorFactory.forbidden('Account is not verified')
          }
        }
      }

      // Apply timeout if specified
      let timeoutId: NodeJS.Timeout | undefined
      if (timeout > 0) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(ErrorFactory.internalError('Request timeout'))
          }, timeout)
        })

        // Race the handler against the timeout
        const result = await Promise.race([
          handler(context),
          timeoutPromise
        ])

        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        // Record metrics
        endRequestTiming(timing)
        if (enableMetrics) {
          const endpoint = new URL(request.url).pathname
          PerformanceMetrics.recordRequest(endpoint, timing.duration || 0, true)
        }

        return result as NextResponse | Response
      }

      // Execute handler without timeout
      const result = await handler(context)

      // Record metrics
      endRequestTiming(timing)
      if (enableMetrics) {
        const endpoint = new URL(request.url).pathname
        PerformanceMetrics.recordRequest(endpoint, timing.duration || 0, true)
      }

      return result as NextResponse | Response

    } catch (error) {
      // Record error metrics
      endRequestTiming(timing)
      if (enableMetrics) {
        const endpoint = new URL(request.url).pathname
        PerformanceMetrics.recordRequest(endpoint, timing.duration || 0, false)
      }

      // Return standardized error response
      return createErrorResponse(error, request)
    }
  })
}

/**
 * Creates a GET API handler
 */
export function createGetHandler<T = any>(
  handler: ApiHandlerFunction<T>,
  options?: ApiHandlerOptions
) {
  return createApiHandler(handler, options)
}

/**
 * Creates a POST API handler
 */
export function createPostHandler<T = any>(
  handler: ApiHandlerFunction<T>,
  options?: ApiHandlerOptions
) {
  return createApiHandler(handler, options)
}

/**
 * Creates a PUT API handler
 */
export function createPutHandler<T = any>(
  handler: ApiHandlerFunction<T>,
  options?: ApiHandlerOptions
) {
  return createApiHandler(handler, options)
}

/**
 * Creates a DELETE API handler
 */
export function createDeleteHandler<T = any>(
  handler: ApiHandlerFunction<T>,
  options?: ApiHandlerOptions
) {
  return createApiHandler(handler, options)
}

/**
 * Creates a handler that accepts multiple HTTP methods
 */
export function createMultiMethodHandler<T = any>(
  handlers: {
    GET?: ApiHandlerFunction<T>
    POST?: ApiHandlerFunction<T>
    PUT?: ApiHandlerFunction<T>
    DELETE?: ApiHandlerFunction<T>
    PATCH?: ApiHandlerFunction<T>
  },
  options?: ApiHandlerOptions
) {
  return createApiHandler(async (context) => {
    const { request } = context
    const method = request.method

    const handler = handlers[method as keyof typeof handlers]

    if (!handler) {
      throw ErrorFactory.methodNotAllowed(method)
    }

    return await handler(context)
  }, options)
}

/**
 * Middleware for request body validation
 */
export function withValidation<T>(
  schema: {
    safeParse: (data: any) => { success: boolean; data?: T; error?: any }
  },
  handler: (context: ApiContext & { body: T }) => Promise<Response | NextResponse>
) {
  return async (context: ApiContext): Promise<Response | NextResponse> => {
    try {
      const body = await context.request.json()
      const validation = schema.safeParse(body)

      if (!validation.success) {
        const errors = validation.error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))

        throw ErrorFactory.validationError('Request body validation failed', { errors })
      }

      return await handler({ ...context, body: validation.data! })
    } catch (error) {
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        throw ErrorFactory.validationError('Invalid JSON in request body')
      }
      throw error
    }
  }
}

/**
 * Health check endpoint handler
 */
export function createHealthCheckHandler(
  checks?: Record<string, () => Promise<boolean>>
) {
  return createApiHandler(async () => {
    const results: Record<string, any> = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || 'unknown'
    }

    // Run custom health checks if provided
    if (checks) {
      results.checks = {}
      for (const [name, check] of Object.entries(checks)) {
        try {
          const startTime = Date.now()
          const passed = await check()
          const duration = Date.now() - startTime

          results.checks[name] = {
            status: passed ? 'pass' : 'fail',
            duration,
            timestamp: new Date().toISOString()
          }

          if (!passed) {
            results.status = 'unhealthy'
          }
        } catch (error) {
          results.checks[name] = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
          results.status = 'unhealthy'
        }
      }
    }

    return Response.json(results)
  }, { requireAuth: false })
}