// app/page.tsx
import { ProductGrid } from "@/components/product-grid"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { Suspense } from "react"
import { Metadata } from "next"
import { generateOrganizationSchema, generateFAQSchema } from "@/lib/seo/structured-data"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'

// SEO Metadata for homepage - Enhanced for top rankings
export const metadata: Metadata = {
  title: "Your Marketplace - Buy & Sell Everything in Canada | Free Classifieds | #1 Marketplace",
  description: "Canada's #1 fastest growing marketplace. Buy and sell cars, electronics, jobs, real estate, fashion, home goods, and more. 50K+ trusted users, 5K+ active ads. Free classifieds forever. Secure transactions. Start selling today!",
  keywords: "buy, sell, marketplace, canada, classifieds, cars, electronics, jobs, real estate, fashion, home, garden, pets, services, free ads, local marketplace, buy and sell canada, canadian marketplace, free classifieds canada, local buy sell, marketplace canada, online marketplace, second hand, used items, sell online, buy online canada",
  openGraph: {
    title: "Your Marketplace - Buy & Sell Everything in Canada | Free Forever",
    description: "Canada's fastest growing marketplace. 50K+ trusted users. Buy and sell cars, electronics, jobs, real estate and more. Free classifieds forever, secure transactions.",
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
    description: "Canada's fastest growing marketplace. 50K+ trusted users. Find great deals near you! Free classifieds forever, secure transactions.",
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
  other: {
    'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
  },
}

// Enhanced structured data for homepage
const homepageStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Your Marketplace",
  "url": siteUrl,
  "description": "Canada's fastest growing online marketplace for buying and selling everything locally. Free classifieds forever, secure transactions, trusted by 50K+ users.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${siteUrl}/search?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
}

// Organization schema for E-E-A-T and trust signals
const organizationSchema = generateOrganizationSchema({
  name: "Your Marketplace",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: "Canada's fastest growing marketplace for buying and selling locally. Free classifieds, secure transactions, trusted by 50K+ users.",
  contactPoint: {
    contactType: "Customer Service",
    email: process.env.CONTACT_EMAIL || "support@yourdomain.com",
  },
  sameAs: [
    "https://www.facebook.com/yourmarketplace",
    "https://twitter.com/yourmarketplace",
    "https://www.instagram.com/yourmarketplace",
  ],
  address: {
    addressCountry: "CA",
    addressLocality: "Canada",
  },
})

// FAQ schema - CRUCIAL for AI Search (Google AI Overview, Perplexity, etc.)
const faqSchema = generateFAQSchema({
  questions: [
    {
      question: "Is Your Marketplace free to use?",
      answer: "Yes! Your Marketplace is 100% free forever. You can post unlimited ads, browse listings, and contact sellers at no cost. No credit card required, no hidden fees.",
    },
    {
      question: "How do I sell items on Your Marketplace?",
      answer: "Selling is easy! Click the '+ Sell' button, create an account (free), fill in your product details, upload photos, and publish. Your ad goes live instantly and is visible to thousands of buyers.",
    },
    {
      question: "Is Your Marketplace safe to use?",
      answer: "Yes, Your Marketplace is a verified and secure platform. We have 50K+ trusted users, SSL encryption, and safety guidelines. Always meet in public places, verify items before buying, and never share banking details.",
    },
    {
      question: "What can I buy and sell on Your Marketplace?",
      answer: "You can buy and sell almost anything: cars, electronics, furniture, real estate, fashion, home goods, pets, services, and more. We have categories for everything you need.",
    },
    {
      question: "How do I contact a seller?",
      answer: "Click on any product listing, then click 'Contact Seller' to send a message. You can also view the seller's profile, ratings, and response time before contacting.",
    },
    {
      question: "Can I post ads for free forever?",
      answer: "Yes! All ads are free forever. No payment required, no credit card needed. Post as many ads as you want, whenever you want, completely free.",
    },
    {
      question: "How do I search for items?",
      answer: "Use our search bar to find items by keyword, or browse by category. You can filter by location, price range, condition, and more. Save your searches to get alerts for new listings.",
    },
    {
      question: "What makes Your Marketplace different?",
      answer: "Your Marketplace is Canada's fastest growing marketplace with 50K+ trusted users. We offer free ads forever, direct website links, YouTube video integration, and a secure platform for safe transactions.",
    },
  ],
})

export default function HomePage() {
  return (
    <>
      {/* Enhanced Structured Data for SEO and AI Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="min-h-screen bg-background">
        <main itemScope itemType="https://schema.org/WebPage">
          <HeroSection />
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