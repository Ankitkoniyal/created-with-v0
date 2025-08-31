import type React from "react"
import Image from "next/image"
import type { Product } from "@/types" // Assuming Product type is declared somewhere

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  ;<div className="relative w-full aspect-square overflow-hidden rounded-md">
    <Image
      src={product?.imageUrl || "/placeholder.svg?height=400&width=400&query=product%20image"}
      alt={product?.title || "Product image"}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      className="object-cover"
      loading="lazy"
    />
  </div>
}

export default ProductCard
