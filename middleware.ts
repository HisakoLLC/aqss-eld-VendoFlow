import { NextResponse, type NextRequest } from "next/server"

export const config = {
  matcher: [], // Empty matcher: authentication is handled client-side by AuthProvider and ProtectedRoute
}

export function middleware(request: NextRequest) {
  return NextResponse.next()
}
