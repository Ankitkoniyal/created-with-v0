import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
  const supabase = createClient()

  // Get all active products
  const { data: products } = await supabase
    .from('products')
    .select('id, title, category_slug, subcategory_slug, updated_at, created_at')
    .eq('status', 'active')
    .limit(1000)

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, name')
    .limit(50)

  const productUrls = (products || []).map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: product.updated_at || product.created_at,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const categoryUrls = (categories || []).map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sell`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...categoryUrls,
    ...productUrls,
  ]
}
