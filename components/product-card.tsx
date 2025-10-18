import type React from "react"
import Image from "next/image"
import type { Product } from "@/types"
import { getOptimizedImageUrl } from "@/lib/images"

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const optimizedSrc = getOptimizedImageUrl(product?.images?.[0], "card") || "/modern-tech-product.png"

  return (
    <div className="relative w-full aspect-square overflow-hidden rounded-md">
      <Image
        src={optimizedSrc || "/placeholder.svg"}
        alt={product?.title || "Product image"}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        className="object-cover"
        loading="lazy"
      />
    </div>
  )
}

export default ProductCard
