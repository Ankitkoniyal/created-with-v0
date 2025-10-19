import {
  Car,
  Smartphone,
  Home,
  Shirt,
  Gamepad2,
  Book,
  Wrench,
  PawPrint,
  Sofa,
  Briefcase,
  Phone,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const categories = [
  { name: "Vehicles", icon: Car },
  { name: "Electronics", icon: Smartphone },
  { name: "Mobile", icon: Phone },
  { name: "Real Estate", icon: Home },
  { name: "Fashion", icon: Shirt },
  { name: "Pets", icon: PawPrint },
  { name: "Furniture", icon: Sofa },
  { name: "Jobs", icon: Briefcase },
  { name: "Gaming", icon: Gamepad2 },
  { name: "Books", icon: Book },
  { name: "Services", icon: Wrench },
  { name: "Other", icon: MoreHorizontal },
]

export function CategoryNav() {
  return (
    <section className="py-8 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl font-bold text-foreground mb-6">Browse Categories</h3>
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 lg:gap-3">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.name}
                variant="ghost"
                className="flex flex-col items-center p-2 lg:p-3 h-auto hover:bg-green-50 hover:text-green-600 hover:border-green-200 hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out border border-transparent rounded-lg group"
                asChild
              >
                <Link href={`/search?category=${encodeURIComponent(category.name)}`}>
                  <Icon className="h-6 w-6 lg:h-8 lg:w-8 mb-1 lg:mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs lg:text-sm font-medium text-center leading-tight">{category.name}</span>
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
