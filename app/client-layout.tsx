"use client"

import { Suspense } from "react"
import { AuthProvider } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { WebVitalsClient } from "@/components/metrics/web-vitals-client"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<div className="h-16 bg-white border-b"></div>}>
          <Header />
        </Suspense>
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster 
          position="top-right"
          theme="dark"
          richColors
          closeButton
          duration={4000}
          expand={false}
        />
        <WebVitalsClient />
      </AuthProvider>
    </ErrorBoundary>
  )
}
