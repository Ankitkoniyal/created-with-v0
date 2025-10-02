import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { Suspense } from "react" // ← ADD THIS IMPORT
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { WebVitalsClient } from "@/components/metrics/web-vitals-client"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "MarketPlace - Buy & Sell Everything",
  description: "Your trusted marketplace for buying and selling products locally",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
  const publicAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""

  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        {publicUrl && <meta name="supabase-url" content={publicUrl} />}
        {publicAnon && <meta name="supabase-anon" content={publicAnon} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (typeof window === 'undefined') return;
                if (!window.__supabase) {
                  var url = ${JSON.stringify(publicUrl)};
                  var key = ${JSON.stringify(publicAnon)};
                  if (url && key) {
                    window.__supabase = { url: url, key: key };
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${dmSans.className} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            {/* WRAP HEADER IN SUSPENSE - THIS IS THE CRITICAL FIX */}
            <Suspense fallback={
              <header className="sticky top-0 z-50 bg-background border-b border-border h-16 animate-pulse">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                  <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 max-w-2xl mx-8">
                    <div className="h-10 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="h-8 w-24 bg-gray-300 rounded-full"></div>
                </div>
              </header>
            }>
              <Header />
            </Suspense>
            
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster />
            <WebVitalsClient />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
