import { z } from 'zod'
import { createPostHandler, withValidation, ErrorFactory } from '@/lib/api-wrapper'
import { paymentRequestSchema } from '@/lib/api-schemas'

/**
 * POST /api/pay
 * Processes a payment from the authenticated user to another user
 *
 * Request body: {
 *   recipientId: string (UUID),
 *   amount: number,
 *   orderid?: string,
 *   bayarvia?: string,
 *   namaproduk?: string,
 *   catatan?: string
 * }
 *
 * Response: {
 *   transactionId: string,
 *   orderid: string,
 *   amount: number,
 *   senderNewBalance: number,
 *   receiverNewBalance: number
 * }
 */
export const POST = createPostHandler(
  withValidation(paymentRequestSchema, async ({ supabase, userId, body }) => {
    const senderId = userId!
    const {
      recipientId,
      amount,
      orderid,
      bayarvia = 'transfer',
      namaproduk,
      catatan
    } = body

    // Additional validation: prevent self-transfer
    if (senderId === recipientId) {
      throw ErrorFactory.validationError('Cannot send payment to yourself')
    }

    // Verify that the recipient exists and is not banned
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, banned, verified')
      .eq('id', recipientId)
      .single()

    if (recipientError || !recipient) {
      throw ErrorFactory.notFound('Recipient account not found or is inactive')
    }

    if (recipient.banned) {
      throw ErrorFactory.forbidden('Recipient account is suspended')
    }

    // Call the handle_payment RPC function
    const { data: paymentResult, error: paymentError } = await supabase.rpc('handle_payment', {
      p_sender_id: senderId,
      p_receiver_id: recipientId,
      p_amount: amount,
      p_orderid: orderid,
      p_bayarvia: bayarvia,
      p_namaproduk: namaproduk,
      p_catatan: catatan
    })

    if (paymentError) {
      throw ErrorFactory.paymentError('Payment processing failed', paymentError)
    }

    // Parse the payment result
    const result = paymentResult

    if (!result.success) {
      // Handle specific payment errors
      switch (result.code) {
        case 'INVALID_AMOUNT':
          throw ErrorFactory.validationError('Invalid payment amount')

        case 'SELF_TRANSFER':
          throw ErrorFactory.validationError('Cannot send payment to yourself')

        case 'SENDER_NOT_FOUND':
          throw ErrorFactory.notFound('Sender account not found or is banned')

        case 'RECEIVER_NOT_FOUND':
          throw ErrorFactory.notFound('Recipient account not found or is banned')

        case 'SENDER_BALANCE_NOT_FOUND':
          throw ErrorFactory.notFound('Sender balance not found')

        case 'INSUFFICIENT_FUNDS':
          throw ErrorFactory.insufficientFunds()

        case 'DUPLICATE_ORDERID':
          throw ErrorFactory.validationError('Order ID already exists')

        default:
          throw ErrorFactory.paymentError(result.error || 'Payment processing failed', {
            code: result.code
          })
      }
    }

    // Return success response
    return {
      success: true,
      data: {
        transactionId: result.transaction_id,
        orderid: result.orderid,
        amount: result.amount,
        senderNewBalance: result.sender_new_balance,
        receiverNewBalance: result.receiver_new_balance
      }
    }
  })
)

/**
 * GET /api/pay
 * Placeholder for future payment history or status check functionality
 * Currently returns a 405 Method Not Allowed
 */
export const GET = createPostHandler(async () => {
  throw ErrorFactory.methodNotAllowed('GET')
}, { requireAuth: false })