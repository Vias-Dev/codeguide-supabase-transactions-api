import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { apiKeyMiddleware } from "@/lib/api-auth-middleware"

/**
 * API key authentication middleware for transaction system
 * This handles authentication for /api routes using x-api-key header
 */
async function apiAuthMiddleware(request: NextRequest): Promise<NextResponse | null> {
  return await apiKeyMiddleware(request)
}

/**
 * Main middleware function
 * Combines API key authentication for transaction endpoints
 */
export default async function middleware(request: NextRequest) {
  // First, check if this is an API route that needs API key authentication
  const apiAuthResult = await apiAuthMiddleware(request)
  if (apiAuthResult) {
    return apiAuthResult
  }

  // For other routes, you can add Clerk authentication here if needed
  // For now, allow all other requests to proceed
  return NextResponse.next()
}

/**
 * Uncomment the following code to enable authentication with Clerk
 */

// const isProtectedRoute = createRouteMatcher(['/protected'])

// export default clerkMiddleware(async (auth, req) => {
//     if (isProtectedRoute(req)) {
//       // Handle protected routes check here
//       return NextResponse.redirect(req.nextUrl.origin)
//     }

//     return NextResponse.next()
// })  

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/webhooks).*)",
  ],
}
