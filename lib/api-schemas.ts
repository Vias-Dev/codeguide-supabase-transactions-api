import { z } from 'zod'
import { VALIDATION_PATTERNS } from './api-route-helpers'

/**
 * Payment request schema for /api/pay endpoint
 */
export const paymentRequestSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID format'),
  amount: z.number()
    .positive('Amount must be positive')
    .min(0.01, 'Minimum amount is 0.01')
    .max(999999999.99, 'Maximum amount is 999,999,999.99'),
  orderid: z.string()
    .min(3, 'Order ID must be at least 3 characters')
    .max(50, 'Order ID too long')
    .regex(VALIDATION_PATTERNS.ORDER_ID, 'Order ID contains invalid characters')
    .optional(),
  bayarvia: z.string()
    .min(1, 'Payment method is required')
    .max(50, 'Payment method too long')
    .optional(),
  namaproduk: z.string()
    .max(255, 'Product name too long')
    .optional(),
  catatan: z.string()
    .max(1000, 'Notes too long (max 1000 characters)')
    .optional()
})

/**
 * Balance update schema for /api/balance POST endpoint
 */
export const balanceUpdateSchema = z.object({
  amount: z.number()
    .min(0, 'Amount cannot be negative')
    .max(999999999.99, 'Amount too large')
    .refine((val) => Number.isFinite(val) && (val * 100) % 1 === 0, {
      message: 'Amount must have at most 2 decimal places'
    })
})

/**
 * Pagination query schema for transaction/mutation history endpoints
 */
export const paginationQuerySchema = z.object({
  limit: z.string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Limit must be a positive number')
    .refine((val) => val <= 100, 'Limit cannot exceed 100')
    .default('50'),
  offset: z.string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 0, 'Offset must be a non-negative number')
    .default('0')
})

/**
 * User schema for user management endpoints
 */
export const userSchema = z.object({
  nama: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  email: z.string().email('Invalid email format'),
  wa: z.string()
    .regex(VALIDATION_PATTERNS.PHONE, 'Invalid phone number format')
    .optional(),
  telegram: z.string().max(100, 'Telegram username too long').optional(),
  role: z.string().max(50, 'Role too long').default('user'),
  verified: z.boolean().default(false)
})

/**
 * API key schema for API key management
 */
export const apiKeySchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  is_active: z.boolean().default(true)
})

/**
 * Export inferred types
 */
export type PaymentRequest = z.infer<typeof paymentRequestSchema>
export type BalanceUpdate = z.infer<typeof balanceUpdateSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type UserCreate = z.infer<typeof userSchema>
export type ApiKeyCreate = z.infer<typeof apiKeySchema>