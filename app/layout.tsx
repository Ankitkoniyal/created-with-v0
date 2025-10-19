import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"

import "./globals.css"
import { ClientLayout } from "./client-layout"

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
        {publicUrl && <meta name="supabase-url" content={publicUrl} />}
        {publicAnon && <meta name="supabase-anon-key" content={publicAnon} />}
      </head>
      <body className={`${dmSans.className} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      
      </body>
    </html>
  )
}
