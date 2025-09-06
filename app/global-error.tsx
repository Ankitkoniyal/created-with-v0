"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global application error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="max-w-md mx-auto px-4">
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Critical Error</h1>
                <p className="text-muted-foreground mb-6">
                  A critical error occurred in the application. Please refresh the page or contact support if the
                  problem persists.
                </p>

                <div className="space-y-3">
                  <Button onClick={reset} className="w-full bg-green-900 hover:bg-green-950">
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
      </body>
    </html>
  )
}
