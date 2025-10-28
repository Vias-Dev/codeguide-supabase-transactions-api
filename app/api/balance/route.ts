import { z } from 'zod'
import { createGetHandler, createPostHandler, withValidation, ErrorFactory } from '@/lib/api-wrapper'
import { balanceUpdateSchema } from '@/lib/api-schemas'

/**
 * GET /api/balance
 * Retrieves the authenticated user's current balance
 *
 * Response: { balance: number }
 */
export const GET = createGetHandler(async ({ supabase, userId }) => {
  // Call the get_user_balance function
  const { data: balance, error } = await supabase.rpc('get_user_balance', {
    user_id_param: userId!
  })

  if (error) {
    throw ErrorFactory.databaseError('Failed to fetch balance', error)
  }

  return {
    success: true,
    data: {
      balance: balance || 0
    }
  }
})

/**
 * POST /api/balance
 * Initialize or update user balance (admin only or for testing)
 * This endpoint can be used to set up initial balances for users
 *
 * Request body: { amount: number }
 * Response: { balance: number }
 */
export const POST = createPostHandler(
  withValidation(balanceUpdateSchema, async ({ supabase, userId, body }) => {
    const { amount } = body

    // Check if balance record exists
    const { data: existingBalance, error: fetchError } = await supabase
      .from('balances')
      .select('amount')
      .eq('user_id', userId!)
      .single()

    let result

    if (fetchError && fetchError.code === 'PGRST116') {
      // No existing balance, create new one
      const { data, error: insertError } = await supabase
        .from('balances')
        .insert({
          user_id: userId!,
          amount: amount
        })
        .select('amount')
        .single()

      if (insertError) {
        throw ErrorFactory.databaseError('Failed to create balance', insertError)
      }

      result = data
    } else if (fetchError) {
      throw ErrorFactory.databaseError('Failed to check existing balance', fetchError)
    } else {
      // Update existing balance
      const { data, error: updateError } = await supabase
        .from('balances')
        .update({
          amount: amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId!)
        .select('amount')
        .single()

      if (updateError) {
        throw ErrorFactory.databaseError('Failed to update balance', updateError)
      }

      result = data
    }

    return {
      success: true,
      data: {
        balance: result.amount
      }
    }
  })
)