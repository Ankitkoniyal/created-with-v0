import { ProductDetail } from "@/components/product-detail"
import { RelatedProducts } from "@/components/related-products"
import { Breadcrumb } from "@/components/breadcrumb"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SafeProductDetail } from "@/components/safe-product-detail"

interface ProductPageProps {
  params: {
    id: string
  }
}

async function getProduct(id: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(id)) {
    return null
  }

  const supabase = await createClient()

  try {
    const { data: products, error } = await supabase.from("products").select("*").eq("id", id)

    if (error) {
      console.error("Database error fetching product:", error.message)
      return null
    }

    if (!products || products.length === 0) {
      console.error("Product not found:", id)
      return null
    }

    const product = products[0]

    let profileData = null
    if (product.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, created_at, phone")
        .eq("id", product.user_id)
        .single()

      profileData = profile
    }

    let parsedTags = []
    if (product.tags) {
      try {
        parsedTags = Array.isArray(product.tags) ? product.tags : JSON.parse(product.tags)
      } catch (error) {
        console.error("Error parsing tags:", error)
        parsedTags = []
      }
    }

    let parsedFeatures = []
    if (product.features) {
      try {
        parsedFeatures = Array.isArray(product.features) ? product.features : JSON.parse(product.features)
      } catch (error) {
        console.error("Error parsing features:", error)
        parsedFeatures = []
      }
    }

    const extractUrls = (description: string) => {
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g
      const websiteRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/g

      const youtubeMatches = description.match(youtubeRegex) || []
      const websiteMatches = description.match(websiteRegex) || []

      const filteredWebsiteMatches = websiteMatches.filter(
        (url) => !url.includes("youtube.com") && !url.includes("youtu.be"),
      )

      let cleanDescription = description
      youtubeMatches.forEach((url) => {
        cleanDescription = cleanDescription.replace(url, "").trim()
      })
      filteredWebsiteMatches.forEach((url) => {
        cleanDescription = cleanDescription.replace(url, "").trim()
      })

      return {
        youtubeUrl: youtubeMatches[0] || null,
        websiteUrl: filteredWebsiteMatches[0] || null,
        cleanDescription: cleanDescription.replace(/\s+/g, " ").trim(),
      }
    }

    const { youtubeUrl, websiteUrl, cleanDescription } = extractUrls(product.description || "")

    const generateAdId = (productId: string, createdAt: string) => {
      const date = new Date(createdAt)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const day = date.getDate().toString().padStart(2, "0")
      const idSuffix = productId.replace(/-/g, "").substring(0, 4).toUpperCase()
      return `AD${year}${month}${day}${idSuffix}`
    }

    // RETURN WITH SAFE DEFAULTS - NO UNDEFINED VALUES
    return {
      id: product.id,
      title: product.title || "Untitled Product",
      price: product.price ? `$${product.price.toLocaleString()}` : "Price on request",
      location: (product.city && product.province) ? `${product.city}, ${product.province}` : product.location || "Location not specified",
      images: product.images || ["/placeholder.svg"],
      description: cleanDescription || "No description available",
      youtube_url: product.youtube_url || youtubeUrl,
      website_url: product.website_url || websiteUrl,
      category: product.category || "Other",
      subcategory: product.subcategory || null,
      condition: product.condition || "Used",
      brand: product.brand || null,
      model: product.model || null,
      tags: parsedTags,
      postedDate: product.created_at,
      views: product.views || 0,
      adId: generateAdId(product.id, product.created_at),
      seller: {
        id: product.user_id,
       name: profileData?.full_name, // Show real user name only
        rating: 4.5,
        totalReviews: 0,
        memberSince: profileData?.created_at ? new Date(profileData.created_at).getFullYear().toString() : "2024",
        verified: true,
        responseTime: "Usually responds within 2 hours",
        phone: profileData?.phone || null,
      },
      features: parsedFeatures,
      storage: product.storage || null,
      color: product.color || null,
      featured: false,
    }
  } catch (error) {
    console.error("Unexpected error fetching product:", error)
    return null
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = params
  console.log('🛠️ Product page loading for ID:', id)
  
  const product = await getProduct(id)
  console.log('🛠️ Product data received:', product ? 'YES' : 'NO')
  
  if (!product) {
    console.log('🛠️ Product not found, showing 404')
    notFound()
  }

  console.log('🛠️ Product title:', product.title)
  console.log('🛠️ Product category:', product.category)

  // SAFE BREADCRUMB ITEMS WITH DEFAULTS
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { 
      label: product.category || "Other", 
      href: `/search?category=${encodeURIComponent(product.category || "Other")}` 
    },
    { 
      label: product.title || "Product", 
      href: `/product/${product.id}` 
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <SafeProductDetail product={product} />
        <RelatedProducts 
          currentProductId={product.id} 
          category={product.category || "Other"} 
        />
      </div>
    </div>
  )
}
