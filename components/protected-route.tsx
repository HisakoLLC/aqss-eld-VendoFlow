"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle authentication check and redirect
  useEffect(() => {
    // Skip if still loading or not client-side yet
    if (isLoading || !isClient) return

    // If no user is found after loading completes, redirect to login
    if (!user) {
      console.log("No authenticated user found, redirecting to login")
      // Encode the current path to redirect back after login
      const returnPath = encodeURIComponent(pathname)
      router.push(`/login?redirectTo=${returnPath}`)
    }
  }, [user, isLoading, router, pathname, isClient])

  // Show loading state while checking auth
  if (isLoading || !isClient) {
    return (
      fallback || (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying access...</p>
          </div>
        </div>
      )
    )
  }

  // If not authenticated, return null (redirect will happen in useEffect)
  if (!user) {
    return null
  }

  // User is authenticated, render children
  return <>{children}</>
}
