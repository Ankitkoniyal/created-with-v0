import { ProductDetail } from "@/components/product-detail"
import { RelatedProducts } from "@/components/related-products"
import { Breadcrumb } from "@/components/breadcrumb"
import { createClient } from "@/lib/supabase/client"
import { notFound } from "next/navigation"

interface ProductPageProps {
  params: {
    id: string
  }
}

async function getProduct(id: string) {
  const supabase = createClient()

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url,
        created_at
      )
    `)
    .eq("id", id)
    .eq("status", "active")
    .single()

  if (error || !product) {
    console.error("[v0] Error fetching product:", error)
    return null
  }

  return {
    id: product.id,
    title: product.title,
    price: `$${product.price.toLocaleString()}`,
    location: product.city && product.province ? `${product.city}, ${product.province}` : product.location,
    images: product.images || ["/placeholder.svg"],
    description: product.description,
    category: product.primary_category || "Other",
    condition: product.condition || "Used",
    brand: "N/A", // TODO: Extract from description or add to database
    model: "N/A", // TODO: Extract from description or add to database
    postedDate: product.created_at,
    views: product.views || 0,
    seller: {
      name: product.profiles?.full_name || "Anonymous Seller",
      rating: 4.5, // TODO: Implement rating system
      totalReviews: 0, // TODO: Implement review system
      memberSince: product.profiles?.created_at
        ? new Date(product.profiles.created_at).getFullYear().toString()
        : "2024",
      verified: true, // TODO: Implement verification system
      responseTime: "Usually responds within 2 hours",
    },
    features: [], // TODO: Extract from description or add to database
    storage: "N/A",
    color: "N/A",
    featured: false,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: product.category, href: `/search?category=${encodeURIComponent(product.category)}` },
    { label: product.title, href: `/product/${product.id}` },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <ProductDetail product={product} />
        <RelatedProducts currentProductId={product.id} category={product.category} />
      </div>
    </div>
  )
}
