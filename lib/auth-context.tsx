"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    // Skip if Supabase client isn't available
    if (!supabase) {
      setIsLoading(false)
      return
    }

    const getSession = async () => {
      setIsLoading(true)
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user || null)

          // If user is logged in and we're on an auth page, redirect to dashboard
          if (
            session &&
            (pathname === "/login" || pathname === "/signup" || pathname === "/reset-password" || pathname === "/")
          ) {
            router.push("/dashboard")
          }
        }
      } catch (error) {
        console.error("Error getting session:", error)
        setSession(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email)
      setSession(session)
      setUser(session?.user || null)

      // Don't set isLoading to false here, as it might cause flickering
      // Only redirect if we're on an auth page and user is logged in
      if (
        session &&
        (pathname === "/login" || pathname === "/signup" || pathname === "/reset-password" || pathname === "/")
      ) {
        router.push("/dashboard")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase, pathname])

  const signIn = async (email: string, password: string) => {
    try {
      if (!supabase) return { error: new Error("Supabase client not available") }

      setIsLoading(true)
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })

      if (!error) {
        // Force a session refresh to ensure we have the latest session data
        const { data: sessionData } = await supabase.auth.getSession()
        setSession(sessionData.session)
        setUser(sessionData.session?.user || null)

        // Use a small timeout to ensure state is updated before redirect
        setTimeout(() => {
          router.push("/dashboard")
        }, 100)
      }

      return { error }
    } catch (error) {
      console.error("Error signing in:", error)
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      if (!supabase) return { error: new Error("Supabase client not available"), data: null }

      const { data, error } = await supabase.auth.signUp({ email, password })
      return { data, error }
    } catch (error) {
      console.error("Error signing up:", error)
      return { error, data: null }
    }
  }

  const signOut = async () => {
    try {
      if (!supabase) return

      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      if (!supabase) return { error: new Error("Supabase client not available") }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      console.error("Error resetting password:", error)
      return { error }
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
