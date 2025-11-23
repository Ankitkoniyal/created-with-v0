// app/category/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { generateItemListSchema, generateBreadcrumbSchema } from '@/lib/seo/structured-data'

interface CategoryPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('name, description, slug')
    .eq('slug', params.slug)
    .single()

  if (!category) {
    return {
      title: 'Category Not Found - Your Marketplace',
      description: 'The category you are looking for is not available.',
    }
  }

  const title = `Buy & Sell ${category.name} in Canada | Your Marketplace`
  const description = category.description || `Find great deals on ${category.name} in Canada. Buy and sell ${category.name} locally with free classifieds. Safe and secure transactions.`
  const keywords = `${category.name}, buy ${category.name}, sell ${category.name}, ${category.name} Canada, ${category.name} marketplace, ${category.name} classifieds, used ${category.name}, new ${category.name}`

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/category/${category.slug}`,
      siteName: 'Your Marketplace',
      images: [{
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: `Buy and Sell ${category.name} - Your Marketplace`,
      }],
      locale: 'en_CA',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.jpg'],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `/category/${category.slug}`,
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const supabase = createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
  
  const { data: category } = await supabase
    .from('categories')
    .select('name, description, slug')
    .eq('slug', params.slug)
    .single()

  if (!category) {
    notFound()
  }

  // Fetch top products in this category for ItemList schema
  const { data: products } = await supabase
    .from('products')
    .select('id, title, images')
    .eq('category', category.name)
    .eq('status', 'active')
    .limit(10)
    .order('created_at', { ascending: false })

  // Generate ItemList schema with actual products
  const itemListItems = (products || []).map((product) => ({
    name: product.title,
    url: `${baseUrl}/product/${product.id}`,
    image: product.images?.[0] ? (product.images[0].startsWith('http') ? product.images[0] : `${baseUrl}${product.images[0]}`) : undefined,
  }))

  const itemListSchema = generateItemListSchema(itemListItems)

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: category.name, url: `${baseUrl}/category/${category.slug}` },
  ])

  // CollectionPage schema
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Buy & Sell ${category.name} in Canada`,
    "description": category.description || `Find great deals on ${category.name} in Canada. Buy and sell ${category.name} locally with free classifieds.`,
    "url": `${baseUrl}/category/${category.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Buy & Sell {category.name}</h1>
        {/* Your category content */}
      </div>
    </>
  )
}
