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
 * GET /api/trx
 * Retrieves transaction history for the authenticated user
 *
 * Query parameters:
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 *
 * Returns transactions where user is either sender or receiver
 *
 * Response: {
 *   transactions: Array<{
 *     id: string,
 *     sender_id: string,
 *     receiver_id: string,
 *     amount: number,
 *     paid: boolean,
 *     orderid: string,
 *     bayarvia: string,
 *     grandtotal: number,
 *     namaproduk: string | null,
 *     catatan: string | null,
 *     created_at: string,
 *     updated_at: string,
 *     direction: 'sent' | 'received' // Indicates user's role in transaction
 *   }>,
 *   pagination: {
 *     limit: number,
 *     offset: number,
 *     hasMore: boolean
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

    const validation = paginationQuerySchema.safeParse(queryObject)
    if (!validation.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400
      )
    }

    const { limit, offset } = validation.data

    // Create Supabase client
    const supabase = createApiRouteClient(request)

    // Get total count first
    const { count: totalCount, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    if (countError) {
      console.error('Error counting transactions:', countError)
      return createErrorResponse(
        'Failed to fetch transaction count',
        'DATABASE_ERROR',
        500
      )
    }

    // Fetch transactions with pagination
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        id,
        sender_id,
        receiver_id,
        amount,
        paid,
        items,
        orderid,
        bayarvia,
        unikcode,
        grandtotal,
        namaproduk,
        catatan,
        created_at,
        updated_at
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError)
      return createErrorResponse(
        'Failed to fetch transactions',
        'DATABASE_ERROR',
        500
      )
    }

    // Add direction field to indicate if user sent or received the transaction
    const enrichedTransactions = transactions?.map(transaction => ({
      ...transaction,
      direction: transaction.sender_id === userId ? 'sent' : 'received' as 'sent' | 'received'
    })) || []

    // Calculate pagination info
    const hasMore = (offset + limit) < (totalCount || 0)

    return createSuccessResponse({
      transactions: enrichedTransactions,
      pagination: {
        limit,
        offset,
        total: totalCount || 0,
        hasMore
      }
    })

  } catch (error) {
    console.error('Transaction history API error:', error)

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
 * POST /api/trx
 * Placeholder for future transaction management functionality
 * Currently returns a 405 Method Not Allowed
 */
export async function POST(request: NextRequest) {
  return createErrorResponse(
    'Method not allowed. Use /api/pay for creating transactions.',
    'METHOD_NOT_ALLOWED',
    405
  )
}

/**
 * PUT /api/trx
 * Placeholder for future transaction update functionality
 * Currently returns a 405 Method Not Allowed
 */
export async function PUT(request: NextRequest) {
  return createErrorResponse(
    'Method not allowed',
    'METHOD_NOT_ALLOWED',
    405
  )
}

/**
 * DELETE /api/trx
 * Placeholder for future transaction deletion functionality
 * Currently returns a 405 Method Not Allowed
 */
export async function DELETE(request: NextRequest) {
  return createErrorResponse(
    'Method not allowed',
    'METHOD_NOT_ALLOWED',
    405
  )
}