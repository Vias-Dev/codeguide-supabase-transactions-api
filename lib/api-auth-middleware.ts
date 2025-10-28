import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from './supabase-service'
import type { Database } from '@/types/database.types'

// Extend the NextRequest type to include context
declare global {
  namespace Express {
    interface Request {
      context?: {
        userId?: string
        apiKey?: string
      }
    }
  }
}

export interface ApiContext {
  userId?: string
  apiKey?: string
}

/**
 * Validates API key and returns user context
 * @param apiKey - The API key from x-api-key header
 * @returns Promise<ApiContext | null> - User context if valid, null if invalid
 */
export async function validateApiKey(apiKey: string): Promise<ApiContext | null> {
  if (!apiKey || typeof apiKey !== 'string') {
    return null
  }

  try {
    const supabase = getServiceClient()

    // Call the validate_api_key function
    const { data, error } = await supabase.rpc('validate_api_key', {
      api_key_param: apiKey
    })

    if (error) {
      console.error('API key validation error:', error)
      return null
    }

    if (data && data.length > 0) {
      const { user_id, is_valid } = data[0]

      if (is_valid && user_id) {
        return {
          userId: user_id,
          apiKey: apiKey
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error validating API key:', error)
    return null
  }
}

/**
 * Middleware function for API key authentication
 * @param request - NextRequest object
 * @returns Promise<NextResponse | null> - NextResponse if authentication fails, null if succeeds
 */
export async function apiKeyMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Only apply to /api routes (excluding webhooks and public routes)
  if (!request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.startsWith('/api/webhooks')) {
    return null
  }

  // Get API key from header
  const apiKey = request.headers.get('x-api-key')

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Missing API key',
        code: 'MISSING_API_KEY',
        message: 'API key is required for this endpoint'
      },
      { status: 401 }
    )
  }

  // Validate API key
  const context = await validateApiKey(apiKey)

  if (!context) {
    return NextResponse.json(
      {
        error: 'Invalid API key',
        code: 'INVALID_API_KEY',
        message: 'The provided API key is invalid or has been revoked'
      },
      { status: 401 }
    )
  }

  // Add user context to request headers for downstream handlers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', context.userId!)
  requestHeaders.set('x-api-key-validated', 'true')

  // Create new request with context
  const newRequest = new NextRequest(request, {
    headers: requestHeaders
  })

  // Return null to continue processing
  return null
}

/**
 * Helper function to get user context from request
 * @param request - NextRequest object
 * @returns ApiContext | null - User context if available
 */
export function getUserContext(request: NextRequest): ApiContext | null {
  const userId = request.headers.get('x-user-id')
  const apiKeyValidated = request.headers.get('x-api-key-validated')

  if (apiKeyValidated === 'true' && userId) {
    return {
      userId,
      apiKey: request.headers.get('x-api-key') || undefined
    }
  }

  return null
}