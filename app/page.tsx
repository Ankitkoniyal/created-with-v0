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
        <div className="flex gap-6 px-4 max-w-7xl mx-auto">
          <div className="flex-1">
            <ProductGrid />
          </div>
          <div className="w-80 hidden lg:block">
            <div className="sticky top-4">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/side%20image-zyngKfoxkLSzBnXsS1v9odRhiZsc4o.webp"
                alt="Canada's #1 Growing Marketplace - Buy, Sell, Connect"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
