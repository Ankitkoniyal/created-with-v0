// app/category/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server"
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

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
  const { data: category } = await supabase
    .from('categories')
    .select('name, description, slug')
    .eq('slug', params.slug)
    .single()

  if (!category) {
    notFound()
  }

  // Generate structured data
  const categoryStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category.name} - Your Marketplace`,
    "description": category.description || `Find great deals on ${category.name} in Canada`,
    "url": `/category/${category.slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "name": category.name
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryStructuredData) }}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Buy & Sell {category.name}</h1>
        {/* Your category content */}
      </div>
    </>
  )
}
