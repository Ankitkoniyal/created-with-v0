"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error using error tracking
    try {
      const { errorTracker } = require("@/lib/error-tracking")
      errorTracker.captureException(error, {
        page: "error-page",
        digest: error.digest,
      })
    } catch {
      // Fallback to console if error tracking not available
      if (process.env.NODE_ENV === "development") {
        console.error("Application error:", error)
      }
    }
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong!</h1>
            <p className="text-muted-foreground mb-6">
              We encountered an unexpected error. Please try again or return to the homepage.
            </p>

            <div className="space-y-3">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>

              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Homepage
                </Link>
              </Button>
            </div>

            {error.digest && <p className="text-xs text-muted-foreground mt-4">Error ID: {error.digest}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
