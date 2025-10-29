import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getUserId,
  createApiRouteClient,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/api-route-helpers'
import { paginationQuerySchema } from '@/lib/api-schemas'
import type { Database } from '@/types/database.types'

/**
 * GET /api/mut
 * Retrieves mutation (balance change) history for the authenticated user
 *
 * Query parameters:
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 * - type: 'debit' | 'credit' (optional filter)
 *
 * Returns balance mutations for the user
 *
 * Response: {
 *   mutations: Array<{
 *     id: string,
 *     user_id: string,
 *     balance: number,
 *     prev_balance: number,
 *     type: 'debit' | 'credit',
 *     catatan: string | null,
 *     transaction_id: string | null,
 *     created_at: string
 *   }>,
 *   pagination: {
 *     limit: number,
 *     offset: number,
 *     total: number,
 *     hasMore: boolean
 *   },
 *   summary: {
 *     total_debits: number,
 *     total_credits: number,
 *     net_change: number
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = getUserId(request)

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryObject = Object.fromEntries(searchParams.entries())

    // Add optional type filter to schema
    const querySchema = paginationQuerySchema.extend({
      type: z.enum(['debit', 'credit']).optional()
    })

    const validation = querySchema.safeParse(queryObject)
    if (!validation.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400
      )
    }

    const { limit, offset, type } = validation.data

    // Create Supabase client
    const supabase = createApiRouteClient(request)

    // Build query
    let query = supabase
      .from('mutations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // Add type filter if provided
    if (type) {
      query = query.eq('type', type)
    }

    // Get total count with filters applied
    const { count: totalCount, error: countError } = await query

    if (countError) {
      console.error('Error counting mutations:', countError)
      return createErrorResponse(
        'Failed to fetch mutation count',
        'DATABASE_ERROR',
        500
      )
    }

    // Fetch mutations with pagination
    const { data: mutations, error: fetchError } = await supabase
      .from('mutations')
      .select(`
        id,
        user_id,
        balance,
        prev_balance,
        type,
        catatan,
        transaction_id,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('Error fetching mutations:', fetchError)
      return createErrorResponse(
        'Failed to fetch mutations',
        'DATABASE_ERROR',
        500
      )
    }

    // Calculate summary statistics
    let totalDebits = 0
    let totalCredits = 0

    mutations?.forEach(mutation => {
      const changeAmount = mutation.balance - mutation.prev_balance
      if (mutation.type === 'debit') {
        totalDebits += Math.abs(changeAmount)
      } else {
        totalCredits += Math.abs(changeAmount)
      }
    })

    const netChange = totalCredits - totalDebits

    // Calculate pagination info
    const hasMore = (offset + limit) < (totalCount || 0)

    return createSuccessResponse({
      mutations: mutations || [],
      pagination: {
        limit,
        offset,
        total: totalCount || 0,
        hasMore
      },
      summary: {
        total_debits: totalDebits,
        total_credits: totalCredits,
        net_change: netChange
      }
    })

  } catch (error) {
    console.error('Mutation history API error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return createErrorResponse(
          'Authentication required',
          'UNAUTHORIZED',
          401
        )
      }
    }

    return createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
  }
}

/**
 * POST /api/mut
 * Placeholder for future mutation management functionality
 * Currently returns a 405 Method Not Allowed
 */
export async function POST(request: NextRequest) {
  return createErrorResponse(
    'Method not allowed. Mutations are created automatically through transactions.',
    'METHOD_NOT_ALLOWED',
    405
  )
}

/**
 * GET /api/mut/summary
 * Alternative endpoint for just getting mutation summary without detailed records
 */
export async function GET_SUMMARY(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = getUserId(request)

    // Create Supabase client
    const supabase = createApiRouteClient(request)

    // Fetch all mutations for summary calculation
    const { data: mutations, error: fetchError } = await supabase
      .from('mutations')
      .select('balance, prev_balance, type')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Error fetching mutations for summary:', fetchError)
      return createErrorResponse(
        'Failed to fetch mutation summary',
        'DATABASE_ERROR',
        500
      )
    }

    // Calculate summary statistics
    let totalDebits = 0
    let totalCredits = 0
    let mutationCount = 0

    mutations?.forEach(mutation => {
      const changeAmount = mutation.balance - mutation.prev_balance
      if (mutation.type === 'debit') {
        totalDebits += Math.abs(changeAmount)
      } else {
        totalCredits += Math.abs(changeAmount)
      }
      mutationCount++
    })

    const netChange = totalCredits - totalDebits

    return createSuccessResponse({
      summary: {
        total_debits: totalDebits,
        total_credits: totalCredits,
        net_change: netChange,
        mutation_count: mutationCount
      }
    })

  } catch (error) {
    console.error('Mutation summary API error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return createErrorResponse(
          'Authentication required',
          'UNAUTHORIZED',
          401
        )
      }
    }

    return createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
  }
}