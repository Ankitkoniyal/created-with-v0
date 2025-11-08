import { RelatedProducts } from "@/components/related-products"
import { Breadcrumb } from "@/components/breadcrumb"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SafeProductDetail } from "@/components/safe-product-detail"
import { Metadata } from "next"

interface ProductPageProps {
  params: {
    id: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  
  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for is not available.",
    }
  }

  const title = `${product.title} - ${product.price} | Your Marketplace`
  const description = `${product.title} for ${product.price}. ${product.description.substring(0, 160)}${product.description.length > 160 ? '...' : ''} Located in ${product.location}.`
  const images = product.images && product.images.length > 0 ? product.images : ['/og-image.jpg']
  
  return {
    title,
    description,
    keywords: `${product.title}, ${product.category}, ${product.subcategory}, ${product.brand}, ${product.condition}, buy, sell, marketplace`,
    openGraph: {
      title,
      description,
      images: images.map((img: string) => ({
        url: img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}${img}`,
        width: 1200,
        height: 630,
        alt: product.title,
      })),
      type: 'website',
      url: `/product/${product.id}`,
      siteName: 'Your Marketplace',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images[0],
    },
    alternates: {
      canonical: `/product/${product.id}`,
    },
    robots: {
      index: true,
      follow: true,
    },
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
      console.error("Product not found:", id)
      return null
    }

    const product = products[0]

    // Fetch real seller profile when available; fall back gracefully
    let profileData: { full_name: string | null; avatar_url: string | null; created_at: string | null; phone: string | null } = {
      full_name: null,
      avatar_url: null,
      created_at: product.created_at,
      phone: null,
    }

    if (product.user_id) {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles_public')
        .select('full_name, avatar_url, created_at, phone')
        .eq('id', product.user_id)
        .single()

      if (!profileErr && profile) {
        profileData = {
          full_name: profile.full_name || null,
          avatar_url: profile.avatar_url || null,
          created_at: profile.created_at || product.created_at,
          phone: profile.phone || null,
        }
      } else {
        const readableName = `Verified Seller`
        profileData = {
          full_name: readableName,
          avatar_url: null,
          created_at: product.created_at,
          phone: null,
        }
        if (process.env.NODE_ENV !== "production") {
          console.log("🛠️ Using fallback seller name:", readableName)
        }
      }
    } else {
      profileData = {
        full_name: 'Local Seller',
        avatar_url: null,
        created_at: product.created_at,
        phone: null,
      }
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

    // RETURN WITH PROPER SELLER DATA
    return {
      id: product.id,
      title: product.title || "Untitled Product",
      price: product.price ? `$${product.price.toLocaleString()}` : "Price on request",
      location: (product.city && product.province) ? `${product.city}, ${product.province}` : product.location || "Location not specified",
      images: (() => {
        const raw = product.images || []
        const cleaned = raw.filter((u: string) => 
          u && 
          !u.includes('diverse-products-still-life.png') &&
          !u.includes('modern-tech-product.png')
        )
        return cleaned.length > 0 ? cleaned : ["/placeholder.svg"]
      })(),
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
        name: profileData?.full_name || 'Local Seller',
        rating: 4.5,
        totalReviews: 0,
        memberSince: profileData?.created_at ? new Date(profileData.created_at).getFullYear().toString() : "2024",
        verified: true,
        responseTime: "Usually responds within 2 hours",
        phone: profileData?.phone || null,
        avatar: profileData?.avatar_url || null,
      },
      features: parsedFeatures,
      storage: product.storage || null,
      color: product.color || null,
      featured: false,
      // Additional fields for SEO
      price_number: product.price || 0,
      category_slug: product.category_slug || product.category?.toLowerCase().replace(/\s+/g, '-') || 'other',
      created_at: product.created_at,
      updated_at: product.updated_at || product.created_at,
      user_id: product.user_id,
    }
  } catch (error) {
    console.error("Unexpected error fetching product:", error)
    return null
  }
}

// Generate structured data for rich snippets
function generateProductStructuredData(product: any) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
  
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "description": product.description,
    "image": product.images.map((img: string) => 
      img.startsWith('http') ? img : `${baseUrl}${img}`
    ),
    "sku": product.adId,
    "mpn": product.adId,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Generic"
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/product/${product.id}`,
      "priceCurrency": "CAD",
      "price": product.price_number,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": "https://schema.org/InStock",
      "itemCondition": `https://schema.org/${mapConditionToSchemaOrg(product.condition)}`,
      "seller": {
        "@type": "Organization",
        "name": "Your Marketplace"
      }
    },
    "category": product.category,
    "productID": product.id,
    "datePosted": product.created_at,
    "location": {
      "@type": "Place",
      "name": product.location
    }
  }
}

function mapConditionToSchemaOrg(condition: string): string {
  const conditionMap: { [key: string]: string } = {
    "new": "NewCondition",
    "like new": "ExcellentCondition", 
    "excellent": "ExcellentCondition",
    "good": "GoodCondition",
    "fair": "FairCondition",
    "salvage": "DamagedCondition"
  }
  return conditionMap[condition.toLowerCase()] || "UsedCondition"
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const debug = (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(...args)
    }
  }

  debug("🛠️ Product page loading for ID:", id)

  const product = await getProduct(id)
  debug("🛠️ Product data received:", product ? "YES" : "NO")

  if (!product) {
    debug("🛠️ Product not found, showing 404")
    notFound()
  }

  debug("🛠️ Product title:", product.title)
  debug("🛠️ Product seller name:", product.seller.name)
  debug("🛠️ Product category:", product.category)

  // Generate structured data
  const structuredData = generateProductStructuredData(product)
  const breadcrumbStructuredData = {
   "@context": "https://schema.org",
   "@type": "BreadcrumbList",
   "itemListElement": [
     {
       "@type": "ListItem",
       "position": 1,
       "name": "Home",
       "item": process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
     },
     {
       "@type": "ListItem",
       "position": 2,
       "name": product.category,
       "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/search?category=${encodeURIComponent(product.category)}`
     },
     {
       "@type": "ListItem", 
       "position": 3,
       "name": product.title,
       "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/product/${product.id}`
     }
   ]
 }

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
     {/* Structured Data for SEO */}
     <script
       type="application/ld+json"
       dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
     />
     <script
       type="application/ld+json" 
       dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
     />
     
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
       <Breadcrumb items={breadcrumbItems} />
       <SafeProductDetail product={product} />
       <RelatedProducts 
         currentProductId={product.id} 
         category={product.category || "Other"} 
         subcategory={product.subcategory}
       />
     </div>
   </div>
 )
}
