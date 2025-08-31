import { CategoryNav } from "@/components/category-nav"
import { ProductGrid } from "@/components/product-grid"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <CategoryNav />
        <div className="px-4 max-w-7xl mx-auto">
          <ProductGrid />
        </div>
      </main>
      <Footer />
    </div>
  )
}
