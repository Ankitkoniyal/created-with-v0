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
    return null
  }

  const supabase = createClient()

  try {
    const { data: products, error } = await supabase.from("products").select("*").eq("id", id)

    if (error) {
      console.error("Database error fetching product:", error.message)
      return null
    }

    if (!products || products.length === 0) {
      return null
    }

    const product = products[0]

    let profileData = null
    if (product.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, created_at")
        .eq("id", product.user_id)
        .single()

      profileData = profile
    }

    let parsedTags = null
    if (product.tags) {
      try {
        parsedTags = Array.isArray(product.tags) ? product.tags : JSON.parse(product.tags)
      } catch (error) {
        console.error("Error parsing tags:", error)
        parsedTags = []
      }
    }

    let parsedFeatures = null
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

      // Filter out YouTube URLs from website matches
      const filteredWebsiteMatches = websiteMatches.filter(
        (url) => !url.includes("youtube.com") && !url.includes("youtu.be"),
      )

      // Remove URLs from description
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

      // Use first 4 characters of product ID for consistency
      const idSuffix = productId.replace(/-/g, "").substring(0, 4).toUpperCase()

      return `AD${year}${month}${day}${idSuffix}`
    }

    return {
      id: product.id,
      title: product.title,
      price: `$${product.price.toLocaleString()}`,
      location: product.city && product.province ? `${product.city}, ${product.province}` : product.location,
      images: product.images || ["/placeholder.svg"], // Use images field from database
      description: cleanDescription,
      youtube_url: product.youtube_url || youtubeUrl, // Use database field first, fallback to extracted
      website_url: product.website_url || websiteUrl, // Use database field first, fallback to extracted
      category: product.category || "Other",
      subcategory: product.subcategory || null,
      condition: product.condition || "Used",
      brand: product.brand || null, // Use database field directly
      model: product.model || null, // Use database field directly
      tags: parsedTags, // Include parsed tags from database
      postedDate: product.created_at,
      views: product.views || 0,
      adId: generateAdId(product.id, product.created_at),
      seller: {
        id: product.user_id, // Include seller ID for profile navigation
        name: profileData?.full_name || "Anonymous Seller",
        rating: 4.5,
        totalReviews: 0,
        memberSince: profileData?.created_at ? new Date(profileData.created_at).getFullYear().toString() : "2024",
        verified: true,
        responseTime: "Usually responds within 2 hours",
      },
      features: parsedFeatures || [], // Include parsed features from database
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
