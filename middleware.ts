import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  // Define public paths that don't require authentication
  const publicPaths = ["/login", "/signup", "/reset-password", "/"]
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname)

  // Define API paths that should bypass auth checks
  const isApiPath = request.nextUrl.pathname.startsWith("/api/")

  // Skip auth check for public paths and API routes
  if (isPublicPath || isApiPath) {
    return NextResponse.next()
  }

  // Create a Supabase client for server-side auth check
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get: (name) => request.cookies.get(name)?.value,
      set: (name, value, options) => {
        // This is only used for setting cookies in responses, which we don't need here
      },
      remove: (name, options) => {
        // This is only used for removing cookies in responses, which we don't need here
      },
    },
  })

  try {
    // Check if the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session, redirect to login
    if (!session) {
      const redirectUrl = new URL("/login", request.url)
      // Add the original URL as a query parameter for redirect after login
      redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // User is authenticated, allow access
    return NextResponse.next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    // On error, redirect to login as a fallback
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - Static files (_next/static, _next/image, favicon.ico)
     * - Public files
     * - API routes (handled separately in the middleware)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
