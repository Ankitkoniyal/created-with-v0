// components/category-nav.tsx
import Link from "next/link"

const categories = [
  { name: "Vehicles", icon: "🚗" },
  { name: "Electronics", icon: "📱" },
  { name: "Mobile", icon: "📞" },
  { name: "Real Estate", icon: "🏠" },
  { name: "Fashion", icon: "👕" },
  { name: "Pets", icon: "🐾" },
  { name: "Furniture", icon: "🛋️" },
  { name: "Jobs", icon: "💼" },
  { name: "Gaming", icon: "🎮" },
  { name: "Books", icon: "📚" },
  { name: "Services", icon: "🔧" },
  { name: "Other", icon: "⋯" },
]

export function CategoryNav() {
  return (
    <section className="py-8 border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Browse Categories</h3>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/search?category=${encodeURIComponent(category.name)}`}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all duration-300 group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{category.icon}</span>
              <span className="text-sm font-medium text-center">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
