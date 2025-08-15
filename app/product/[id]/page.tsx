import { ProductDetail } from "@/components/product-detail"
import { RelatedProducts } from "@/components/related-products"
import { Breadcrumb } from "@/components/breadcrumb"

interface ProductPageProps {
  params: {
    id: string
  }
}

const mockProducts = [
  {
    id: "1",
    title: "iPhone 14 Pro Max - Excellent Condition",
    price: "$899",
    location: "TORONTO, ON",
    images: ["/iphone-14-pro-max.png", "/iphone-14-pro-max-back.png", "/iphone-14-pro-max-side.png"],
    description:
      "iPhone 14 Pro Max in excellent condition. Barely used, comes with original box and charger. No scratches or dents. Perfect working condition.",
    category: "Electronics",
    condition: "Excellent",
    brand: "Apple",
    model: "iPhone 14 Pro Max",
    storage: "256GB",
    color: "Space Black",
    postedDate: "2024-01-10",
    views: 245,
    seller: {
      name: "John Smith",
      rating: 4.8,
      totalReviews: 127,
      memberSince: "2020",
      verified: true,
      responseTime: "Usually responds within 1 hour",
    },
    features: ["Face ID", "5G Capable", "Wireless Charging", "Water Resistant"],
    featured: true,
  },
  {
    id: "2",
    title: "2019 Honda Civic - Low Mileage",
    price: "$18,500",
    location: "VANCOUVER, BC",
    images: ["/honda-civic.png", "/honda-civic-interior.png", "/honda-civic-engine.png"],
    description:
      "2019 Honda Civic in excellent condition with low mileage. Well maintained, regular oil changes, non-smoker vehicle. Great fuel economy.",
    category: "Vehicles",
    condition: "Good",
    brand: "Honda",
    model: "Civic",
    storage: "N/A",
    color: "Blue",
    postedDate: "2024-01-08",
    views: 189,
    seller: {
      name: "Sarah Johnson",
      rating: 4.6,
      totalReviews: 89,
      memberSince: "2019",
      verified: true,
      responseTime: "Usually responds within 2 hours",
    },
    features: ["Low Mileage", "Fuel Efficient", "Bluetooth", "Backup Camera"],
    featured: true,
  },
  {
    id: "3",
    title: "Modern Sofa Set - Like New",
    price: "$650",
    location: "MONTREAL, QC",
    images: ["/modern-sofa.png"],
    description:
      "Beautiful modern sofa set in like-new condition. Perfect for any living room. Comfortable and stylish.",
    category: "Furniture",
    condition: "Like New",
    brand: "IKEA",
    model: "Modern Sofa",
    storage: "N/A",
    color: "Grey",
    postedDate: "2024-01-15",
    views: 156,
    seller: {
      name: "Mike Chen",
      rating: 4.9,
      totalReviews: 203,
      memberSince: "2021",
      verified: true,
      responseTime: "Usually responds within 30 minutes",
    },
    features: ["Comfortable", "Modern Design", "Easy to Clean", "Durable"],
    featured: false,
  },
  {
    id: "4",
    title: "Gaming Laptop - RTX 3070",
    price: "$1,200",
    location: "CALGARY, AB",
    images: ["/gaming-laptop.png"],
    description:
      "High-performance gaming laptop with RTX 3070 graphics card. Perfect for gaming and professional work.",
    category: "Electronics",
    condition: "Good",
    brand: "ASUS",
    model: "ROG Strix",
    storage: "1TB SSD",
    color: "Black",
    postedDate: "2024-01-14",
    views: 234,
    seller: {
      name: "Alex Rodriguez",
      rating: 4.7,
      totalReviews: 156,
      memberSince: "2020",
      verified: true,
      responseTime: "Usually responds within 1 hour",
    },
    features: ["RTX 3070", "16GB RAM", "1TB SSD", "RGB Keyboard"],
    featured: false,
  },
]

const getFallbackProduct = (id: string) => ({
  id,
  title: "Product Not Available",
  price: "$0",
  location: "CANADA",
  images: ["/placeholder.svg"],
  description: "This product is currently not available. Please check back later or browse other items.",
  category: "Other",
  condition: "N/A",
  brand: "N/A",
  model: "N/A",
  storage: "N/A",
  color: "N/A",
  postedDate: "2024-01-01",
  views: 0,
  seller: {
    name: "Marketplace",
    rating: 5.0,
    totalReviews: 1,
    memberSince: "2024",
    verified: true,
    responseTime: "Usually responds within 24 hours",
  },
  features: ["Coming Soon"],
  featured: false,
})

export default async function ProductPage({ params }: ProductPageProps) {
  const product = mockProducts.find((p) => p.id === params.id) || getFallbackProduct(params.id)

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: product.category, href: `/category/${product.category.toLowerCase()}` },
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
