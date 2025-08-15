import { Header } from "@/components/header"
import { CategoryNav } from "@/components/category-nav"
import { ProductGrid } from "@/components/product-grid"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <CategoryNav />
        <ProductGrid />
      </main>
      <Footer />
    </div>
  )
}
