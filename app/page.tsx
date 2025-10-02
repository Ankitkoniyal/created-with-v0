import { CategoryNav } from "@/components/category-nav"
import { ProductGrid } from "@/components/product-grid"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { Suspense } from "react" // ← ADD THIS

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <CategoryNav />
        <div className="px-4 max-w-7xl mx-auto">
          {/* WRAP PRODUCTGRID IN SUSPENSE */}
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
  )
}
