import type { NextRequest } from 'next/server'

/**
 * Error codes for consistent error handling
 */
export const ERROR_CODES = {
  // Authentication errors (401)
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_API_KEY: 'INVALID_API_KEY',
  UNAUTHORIZED: 'UNAUTHORIZED',
  EXPIRED_API_KEY: 'EXPIRED_API_KEY',

  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_REQUEST_BODY: 'INVALID_REQUEST_BODY',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_UUID: 'INVALID_UUID',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  SELF_TRANSFER: 'SELF_TRANSFER',
  DUPLICATE_ORDERID: 'DUPLICATE_ORDERID',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RECIPIENT_NOT_FOUND: 'RECIPIENT_NOT_FOUND',
  SENDER_NOT_FOUND: 'SENDER_NOT_FOUND',
  BALANCE_NOT_FOUND: 'BALANCE_NOT_FOUND',
  SENDER_BALANCE_NOT_FOUND: 'SENDER_BALANCE_NOT_FOUND',

  // Payment errors (402)
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',

  // Rate limiting errors (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',

  // Method errors (405)
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  INVALID_METHOD: 'INVALID_METHOD'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

/**
 * Error severity levels for logging
 */
export const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
} as const

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS]

/**
 * Standardized error response structure
 */
export interface ErrorResponse {
  error: string
  code: ErrorCode
  message?: string
  details?: any
  timestamp: string
  requestId?: string
}

/**
 * Enhanced error class for API errors
 */
export class ApiError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: any
  public readonly timestamp: string
  public readonly requestId?: string

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    details?: any,
    requestId?: string
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date().toISOString()
    this.requestId = requestId
  }
}

/**
 * Logger utility for structured logging
 */
export class Logger {
  private static getRequestId(request?: NextRequest): string {
    if (request?.headers) {
      return request.headers.get('x-request-id') ||
             request.headers.get('x-api-key-validated') ||
             'unknown'
    }
    return 'unknown'
  }

  private static formatMessage(
    level: LogLevel,
    message: string,
    data?: any,
    requestId?: string
  ): string {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: requestId || 'unknown',
      ...(data && { data })
    }

    return JSON.stringify(logEntry)
  }

  static error(message: string, error?: any, request?: NextRequest, data?: any): void {
    const requestId = this.getRequestId(request)
    const logMessage = this.formatMessage(LOG_LEVELS.ERROR, message, {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    }, requestId)

    console.error(logMessage)
  }

  static warn(message: string, request?: NextRequest, data?: any): void {
    const requestId = this.getRequestId(request)
    const logMessage = this.formatMessage(LOG_LEVELS.WARN, message, data, requestId)

    console.warn(logMessage)
  }

  static info(message: string, request?: NextRequest, data?: any): void {
    const requestId = this.getRequestId(request)
    const logMessage = this.formatMessage(LOG_LEVELS.INFO, message, data, requestId)

    console.log(logMessage)
  }

  static debug(message: string, request?: NextRequest, data?: any): void {
    const requestId = this.getRequestId(request)
    const logMessage = this.formatMessage(LOG_LEVELS.DEBUG, message, data, requestId)

    if (process.env.NODE_ENV === 'development') {
      console.debug(logMessage)
    }
  }
}

/**
 * Error factory functions for common errors
 */
export const ErrorFactory = {
  unauthorized: (message?: string, details?: any) =>
    new ApiError(
      message || 'Authentication required',
      ERROR_CODES.UNAUTHORIZED,
      401,
      details
    ),

  forbidden: (message?: string, details?: any) =>
    new ApiError(
      message || 'Access forbidden',
      ERROR_CODES.FORBIDDEN,
      403,
      details
    ),

  notFound: (resource?: string, details?: any) =>
    new ApiError(
      `${resource || 'Resource'} not found`,
      ERROR_CODES.NOT_FOUND,
      404,
      details
    ),

  validationError: (message?: string, details?: any) =>
    new ApiError(
      message || 'Validation failed',
      ERROR_CODES.VALIDATION_ERROR,
      400,
      details
    ),

  insufficientFunds: (details?: any) =>
    new ApiError(
      'Insufficient funds',
      ERROR_CODES.INSUFFICIENT_FUNDS,
      402,
      details
    ),

  rateLimitExceeded: (details?: any) =>
    new ApiError(
      'Rate limit exceeded',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      429,
      details
    ),

  internalError: (message?: string, error?: any, details?: any) =>
    new ApiError(
      message || 'Internal server error',
      ERROR_CODES.INTERNAL_ERROR,
      500,
      { ...details, originalError: error instanceof Error ? error.message : error }
    ),

  databaseError: (message?: string, error?: any, details?: any) =>
    new ApiError(
      message || 'Database operation failed',
      ERROR_CODES.DATABASE_ERROR,
      500,
      { ...details, originalError: error instanceof Error ? error.message : error }
    ),

  paymentError: (message?: string, details?: any) =>
    new ApiError(
      message || 'Payment processing failed',
      ERROR_CODES.PAYMENT_ERROR,
      500,
      details
    ),

  methodNotAllowed: (method?: string, details?: any) =>
    new ApiError(
      `Method ${method || 'used'} is not allowed`,
      ERROR_CODES.METHOD_NOT_ALLOWED,
      405,
      details
    )
} as const

/**
 * Converts any error to a standardized API error response
 */
export function handleError(
  error: any,
  request?: NextRequest,
  defaultMessage: string = 'An unexpected error occurred'
): ApiError {
  // If it's already an ApiError, return it
  if (error instanceof ApiError) {
    return error
  }

  // Handle specific error types
  if (error instanceof Error) {
    // Handle JSON parsing errors
    if (error.message.includes('Unexpected end of JSON input')) {
      return ErrorFactory.validationError('Invalid JSON in request body', {
        originalError: error.message
      })
    }

    // Handle authorization errors from middleware
    if (error.message.includes('Unauthorized')) {
      return ErrorFactory.unauthorized(error.message)
    }

    // Handle database errors
    if (error.message.includes('database') || error.message.includes('supabase')) {
      return ErrorFactory.databaseError('Database operation failed', error)
    }
  }

  // Default to internal error
  return ErrorFactory.internalError(defaultMessage, error)
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: ApiError | Error | any,
  request?: NextRequest
): Response {
  const apiError = handleError(error, request)

  // Log the error
  Logger.error(apiError.message, error, request, {
    code: apiError.code,
    statusCode: apiError.statusCode,
    details: apiError.details
  })

  const response: ErrorResponse = {
    error: apiError.message,
    code: apiError.code,
    timestamp: apiError.timestamp,
    requestId: apiError.requestId
  }

  // Add optional fields
  if (apiError.details) {
    response.details = apiError.details
  }

  return Response.json(response, {
    status: apiError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...(apiError.requestId && { 'X-Request-ID': apiError.requestId })
    }
  })
}