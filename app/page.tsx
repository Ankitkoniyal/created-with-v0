// app/page.tsx
import { CategoryNav } from "@/components/category-nav"
import { ProductGrid } from "@/components/product-grid"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { Suspense } from "react"
import { Metadata } from "next"

// SEO Metadata for homepage
export const metadata: Metadata = {
  title: "Your Marketplace - Buy & Sell Everything in Canada | Free Classifieds",
  description: "Canada's fastest growing marketplace. Buy and sell cars, electronics, jobs, real estate, fashion, home goods, and more. Great deals near you! Free classifieds with secure transactions.",
  keywords: "buy, sell, marketplace, canada, classifieds, cars, electronics, jobs, real estate, fashion, home, garden, pets, services, free ads, local marketplace",
  openGraph: {
    title: "Your Marketplace - Buy & Sell Everything in Canada",
    description: "Canada's fastest growing marketplace. Find great deals on cars, electronics, jobs, real estate and more. Free classifieds, secure transactions.",
    type: 'website',
    url: '/',
    siteName: 'Your Marketplace',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Your Marketplace - Buy & Sell Everything in Canada',
    }],
    locale: 'en_CA',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Your Marketplace - Buy & Sell Everything in Canada",
    description: "Canada's fastest growing marketplace. Find great deals near you! Free classifieds, secure transactions.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
}

// Structured data for homepage
const homepageStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Your Marketplace",
  "url": process.env.NEXT_PUBLIC_SITE_URL,
  "description": "Canada's fastest growing online marketplace for buying and selling everything locally",
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${process.env.NEXT_PUBLIC_SITE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
}

export default function HomePage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageStructuredData) }}
      />
      
      <div className="min-h-screen bg-background">
        <main>
          <HeroSection />
          <CategoryNav />
          <div className="px-4 max-w-7xl mx-auto">
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            }>
              <ProductGrid />
            </Suspense>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
