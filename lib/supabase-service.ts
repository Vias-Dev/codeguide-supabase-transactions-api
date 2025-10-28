import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Create a Supabase service role client for API operations
// This uses the SERVICE_ROLE_KEY which has admin privileges
export function createServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Singleton service client instance
let serviceClient: ReturnType<typeof createServiceClient> | null = null

export function getServiceClient() {
  if (!serviceClient) {
    serviceClient = createServiceClient()
  }
  return serviceClient
}