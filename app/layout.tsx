// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/sonner"
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const publicAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        {/* Use consistent meta tag names that match the simplified client */}
        {publicUrl && <meta name="supabase-url" content={publicUrl} />}
        {publicAnon && <meta name="supabase-anon-key" content={publicAnon} />}
      </head>
      <body className={`${dmSans.className} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            {/* Shadcn Sonner Toaster */}
            <Toaster 
              position="top-right"
              theme="dark"
              richColors
              closeButton
              duration={4000}
              expand={false}
            />
            <WebVitalsClient />
            <Analytics />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
