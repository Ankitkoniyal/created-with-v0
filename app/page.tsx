// app/page.tsx
import { Metadata } from "next"
import { HeroSection } from "@/components/hero-section"
import { CategoryNav } from "@/components/category-nav"
import { ProductGrid } from "@/components/product-grid"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Your Marketplace - Buy & Sell Everything in Canada | Free Classifieds",
  description: "Canada's fastest growing marketplace. Buy and sell cars, electronics, jobs, real estate, fashion, home goods, and more.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <CategoryNav />
        <ProductGrid />
      </main>
      <Footer />
    </div>
  )
}
