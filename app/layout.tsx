import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"

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
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${dmSans.style.fontFamily};
  --font-sans: ${dmSans.variable};
}
        `}</style>
        {/* Only inject window.__supabase when both URL and KEY are present to avoid auth-js fetch with empty values */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (typeof window === 'undefined') return;
                if (!window.__supabase) {
                  var url = ${JSON.stringify(
                    process.env.NEXT_PUBLIC_SUPABASE_URL ||
                      process.env.NEXT_PUBLIC_webspaceSUPABASE_URL ||
                      process.env.SUPABASE_URL ||
                      "",
                  )};
                  var key = ${JSON.stringify(
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                      process.env.NEXT_PUBLIC_webspaceSUPABASE_ANON_KEY ||
                      process.env.SUPABASE_ANON_KEY ||
                      "",
                  )};
                  if (url && key) {
                    window.__supabase = { url: url, key: key };
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={dmSans.className}>
        <ErrorBoundary>
          <AuthProvider>
            <Header />
            {children}
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
