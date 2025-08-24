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
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(id)) {
    console.error("[v0] Invalid UUID format:", id)
    return null
  }

  const supabase = createClient()

  try {
    console.log("[v0] Fetching product with ID:", id)

    const { data: products, error } = await supabase.from("products").select("*").eq("id", id)

    if (error) {
      console.error("[v0] Database error fetching product:", error.message)
      return null
    }

    console.log("[v0] Query returned products:", products?.length || 0)

    if (!products || products.length === 0) {
      console.error("[v0] Product not found:", id)
      return null
    }

    const product = products[0]
    console.log("[v0] Product found:", product.title)

    let profileData = null
    if (product.user_id) {
      console.log("[v0] Fetching profile for user:", product.user_id)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, created_at")
        .eq("id", product.user_id)
        .single()

      profileData = profile
      console.log("[v0] Profile found:", profileData?.full_name || "No profile")
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
        name: profileData?.full_name || "Anonymous Seller",
        rating: 4.5, // TODO: Implement rating system
        totalReviews: 0, // TODO: Implement review system
        memberSince: profileData?.created_at ? new Date(profileData.created_at).getFullYear().toString() : "2024",
        verified: true, // TODO: Implement verification system
        responseTime: "Usually responds within 2 hours",
      },
      features: [], // TODO: Extract from description or add to database
      storage: "N/A",
      color: "N/A",
      featured: false,
    }
  } catch (error) {
    console.error("[v0] Unexpected error fetching product:", error)
    return null
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
