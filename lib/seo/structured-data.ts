// Comprehensive Structured Data for SEO and AI Search
// This file contains all schema.org structured data generators

export interface OrganizationSchema {
  name: string
  url: string
  logo?: string
  description?: string
  contactPoint?: {
    telephone?: string
    contactType?: string
    email?: string
  }
  sameAs?: string[] // Social media profiles
  address?: {
    addressCountry: string
    addressLocality: string
    addressRegion?: string
  }
}

export interface ProductSchema {
  name: string
  description: string
  image: string[]
  sku?: string
  brand?: {
    name: string
  }
  offers: {
    price: string
    priceCurrency: string
    availability: string
    itemCondition: string
    url: string
  }
  aggregateRating?: {
    ratingValue: string
    reviewCount: string
  }
  review?: Array<{
    author: string
    datePublished: string
    reviewBody: string
    reviewRating: {
      ratingValue: string
    }
  }>
  category?: string
  condition?: string
  location?: {
    addressLocality: string
    addressRegion: string
    addressCountry: string
  }
}

export interface FAQSchema {
  questions: Array<{
    question: string
    answer: string
  }>
}

export interface LocalBusinessSchema {
  name: string
  description: string
  url: string
  address: {
    addressLocality: string
    addressRegion: string
    postalCode?: string
    addressCountry: string
  }
  geo?: {
    latitude: string
    longitude: string
  }
  telephone?: string
  priceRange?: string
  image?: string[]
  openingHours?: string[]
  aggregateRating?: {
    ratingValue: string
    reviewCount: string
  }
}

/**
 * Generate Organization schema for homepage
 */
export function generateOrganizationSchema(data: OrganizationSchema) {
  const baseSchema: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": data.name,
    "url": data.url,
    "description": data.description || `${data.name} - Canada's fastest growing marketplace for buying and selling locally`,
  }

  if (data.logo) {
    baseSchema.logo = data.logo
  }

  if (data.contactPoint) {
    baseSchema.contactPoint = {
      "@type": "ContactPoint",
      "contactType": data.contactPoint.contactType || "Customer Service",
      ...(data.contactPoint.telephone && { telephone: data.contactPoint.telephone }),
      ...(data.contactPoint.email && { email: data.contactPoint.email }),
    }
  }

  if (data.sameAs && data.sameAs.length > 0) {
    baseSchema.sameAs = data.sameAs
  }

  if (data.address) {
    baseSchema.address = {
      "@type": "PostalAddress",
      "addressCountry": data.address.addressCountry,
      "addressLocality": data.address.addressLocality,
      ...(data.address.addressRegion && { addressRegion: data.address.addressRegion }),
    }
  }

  return baseSchema
}

/**
 * Generate Product schema with all details
 */
export function generateProductSchema(data: ProductSchema) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": data.name,
    "description": data.description,
    "image": Array.isArray(data.image) ? data.image : [data.image],
    ...(data.sku && { sku: data.sku }),
    ...(data.category && { category: data.category }),
    ...(data.condition && { itemCondition: `https://schema.org/${data.condition}Condition` }),
  }

  if (data.brand) {
    schema.brand = {
      "@type": "Brand",
      "name": data.brand.name,
    }
  }

  schema.offers = {
    "@type": "Offer",
    "price": data.offers.price,
    "priceCurrency": data.offers.priceCurrency || "CAD",
    "availability": data.offers.availability || "https://schema.org/InStock",
    "itemCondition": data.offers.itemCondition || "https://schema.org/UsedCondition",
    "url": data.offers.url,
    "seller": {
      "@type": "Organization",
      "name": "Your Marketplace",
    },
  }

  if (data.location) {
    schema.location = {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": data.location.addressLocality,
        "addressRegion": data.location.addressRegion,
        "addressCountry": data.location.addressCountry,
      },
    }
  }

  if (data.aggregateRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": data.aggregateRating.ratingValue,
      "reviewCount": data.aggregateRating.reviewCount,
      "bestRating": "5",
      "worstRating": "1",
    }
  }

  if (data.review && data.review.length > 0) {
    schema.review = data.review.map((rev) => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": rev.author,
      },
      "datePublished": rev.datePublished,
      "reviewBody": rev.reviewBody,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": rev.reviewRating.ratingValue,
        "bestRating": "5",
        "worstRating": "1",
      },
    }))
  }

  return schema
}

/**
 * Generate FAQ schema - CRUCIAL for AI Search
 */
export function generateFAQSchema(data: FAQSchema) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.questions.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  }
}

/**
 * Generate LocalBusiness schema for location-based SEO
 */
export function generateLocalBusinessSchema(data: LocalBusinessSchema) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": data.name,
    "description": data.description,
    "url": data.url,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": data.address.addressLocality,
      "addressRegion": data.address.addressRegion,
      "addressCountry": data.address.addressCountry,
      ...(data.address.postalCode && { postalCode: data.address.postalCode }),
    },
  }

  if (data.geo) {
    schema.geo = {
      "@type": "GeoCoordinates",
      "latitude": data.geo.latitude,
      "longitude": data.geo.longitude,
    }
  }

  if (data.telephone) {
    schema.telephone = data.telephone
  }

  if (data.priceRange) {
    schema.priceRange = data.priceRange
  }

  if (data.image) {
    schema.image = Array.isArray(data.image) ? data.image : [data.image]
  }

  if (data.openingHours) {
    schema.openingHours = data.openingHours
  }

  if (data.aggregateRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": data.aggregateRating.ratingValue,
      "reviewCount": data.aggregateRating.reviewCount,
    }
  }

  return schema
}

/**
 * Generate ItemList schema for category pages
 */
export function generateItemListSchema(items: Array<{ name: string; url: string; image?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": items.length,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": item.name,
        "url": item.url,
        ...(item.image && { image: item.image }),
      },
    })),
  }
}

/**
 * Generate Video schema for YouTube videos
 */
export function generateVideoSchema(videoUrl: string, name: string, description: string, thumbnailUrl?: string) {
  // Extract video ID from YouTube URL
  const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  const videoId = videoIdMatch ? videoIdMatch[1] : null

  if (!videoId) return null

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": name,
    "description": description,
    "thumbnailUrl": thumbnailUrl || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    "uploadDate": new Date().toISOString(),
    "contentUrl": videoUrl,
    "embedUrl": `https://www.youtube.com/embed/${videoId}`,
  }
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url,
    })),
  }
}

/**
 * Generate HowTo schema for guides/tutorials
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string; image?: string; url?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      ...(step.image && { image: step.image }),
      ...(step.url && { url: step.url }),
    })),
  }
}

/**
 * Generate Article schema for blog posts
 */
export function generateArticleSchema(
  headline: string,
  description: string,
  image: string,
  datePublished: string,
  dateModified?: string,
  author?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": headline,
    "description": description,
    "image": image,
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "author": {
      "@type": "Person",
      "name": author || "Your Marketplace",
    },
    "publisher": {
      "@type": "Organization",
      "name": "Your Marketplace",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/logo.png`,
      },
    },
  }
}

