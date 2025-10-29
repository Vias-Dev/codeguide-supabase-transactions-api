import { NextRequest } from 'next/server'
import { getUserContext } from './api-auth-middleware'
import { getServiceClient } from './supabase-service'
import type { Database } from '@/types/database.types'

/**
 * Gets the authenticated user context from the request
 * @param request - NextRequest object
 * @returns ApiContext - User context (throws error if not authenticated)
 */
export function requireAuth(request: NextRequest) {
  const context = getUserContext(request)

  if (!context || !context.userId) {
    throw new Error('Unauthorized: Missing or invalid authentication')
  }

  return context
}

/**
 * Gets the authenticated user ID from the request
 * @param request - NextRequest object
 * @returns string - User ID
 */
export function getUserId(request: NextRequest): string {
  const context = requireAuth(request)
  return context.userId!
}

/**
 * Creates a Supabase client for API routes with the authenticated user context
 * @param request - NextRequest object
 * @returns SupabaseClient - Configured Supabase client
 */
export function createApiRouteClient(request: NextRequest) {
  const supabase = getServiceClient()

  // You can add additional configuration here if needed
  // For now, we use the service client since we're handling auth via API keys
  return supabase
}

/**
 * Standardized error response helper
 * @param message - Error message
 * @param code - Error code
 * @param status - HTTP status code
 * @returns NextResponse - JSON error response
 */
export function createErrorResponse(
  message: string,
  code: string,
  status: number = 400
) {
  return Response.json(
    {
      error: message,
      code,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

/**
 * Standardized success response helper
 * @param data - Response data
 * @returns NextResponse - JSON success response
 */
export function createSuccessResponse(data: any) {
  return Response.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  })
}

/**
 * Common validation patterns for API routes
 */
export const VALIDATION_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  ORDER_ID: /^[A-Za-z0-9_-]{3,50}$/
} as const

/**
 * Validates UUID format
 * @param uuid - UUID string to validate
 * @returns boolean - True if valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  return VALIDATION_PATTERNS.UUID.test(uuid)
}

/**
 * Validates numeric amount (positive numbers with up to 2 decimal places)
 * @param amount - Amount to validate
 * @returns boolean - True if valid amount
 */
export function isValidAmount(amount: any): boolean {
  if (typeof amount !== 'number' && typeof amount !== 'string') {
    return false
  }

  const num = Number(amount)
  return !isNaN(num) && num > 0 && Number.isFinite(num) &&
         (num * 100) % 1 === 0 // Check for at most 2 decimal places
}