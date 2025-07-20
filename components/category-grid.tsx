import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { mockCategories } from "@/lib/mock-data"

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {mockCategories.map((category) => (
        <Link key={category.id} href={`/category/${category.slug}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">{category.icon}</div>
              <p className="text-sm font-medium">{category.name}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
