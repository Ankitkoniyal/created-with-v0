// app/search/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Search Products | Your Marketplace",
  description: "Search thousands of products in Canada. Find great deals on cars, electronics, jobs, real estate, fashion, and more. Free classifieds with secure transactions.",
  keywords: "search, find, browse, products, Canada, marketplace, classifieds, buy, sell",
  openGraph: {
    title: "Search Products | Your Marketplace",
    description: "Search thousands of products in Canada. Find great deals on everything you need.",
    type: 'website',
    url: '/search',
    siteName: 'Your Marketplace',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
