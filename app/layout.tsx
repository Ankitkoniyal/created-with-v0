import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { Header } from "@/components/header" // Keep this import

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
      </head>
      <body className={dmSans.className}>
        <AuthProvider>
          <Header /> {/* This will show on EVERY page */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}