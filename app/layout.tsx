import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import Script from "next/script"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "MarketPlace - Buy & Sell Everything",
  description:
    "Your trusted marketplace for buying and selling products locally. Find great deals on electronics, vehicles, furniture, and more.",
  keywords: "marketplace, buy, sell, electronics, vehicles, furniture, local deals, classified ads",
  authors: [{ name: "MarketPlace Team" }],
  creator: "MarketPlace",
  publisher: "MarketPlace",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "https://marketplace.example.com",
    siteName: "MarketPlace",
    title: "MarketPlace - Buy & Sell Everything",
    description:
      "Your trusted marketplace for buying and selling products locally. Find great deals on electronics, vehicles, furniture, and more.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MarketPlace - Buy & Sell Everything",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MarketPlace - Buy & Sell Everything",
    description: "Your trusted marketplace for buying and selling products locally",
    images: ["/og-image.jpg"],
    creator: "@marketplace",
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://marketplace.example.com",
  },
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
        <link rel="canonical" href="https://marketplace.example.com" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={dmSans.className}>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>

        {/* Structured Data */}
        <Script id="structured-data" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "MarketPlace",
              "description": "Your trusted marketplace for buying and selling products locally",
              "url": "https://marketplace.example.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://marketplace.example.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "sameAs": [
                "https://facebook.com/marketplace",
                "https://twitter.com/marketplace",
                "https://instagram.com/marketplace"
              ]
            }
          `}
        </Script>

        <ErrorBoundary>
          <AuthProvider>
            <Header />
            <main>{children}</main>
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
