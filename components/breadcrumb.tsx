import { ChevronRight } from "lucide-react"
import Link from "next/link"

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const filtered = (items || []).filter((it) => it && it.href !== "/" && it.label?.toLowerCase() !== "home")

  if (!filtered.length) return null

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {filtered.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
          {index === filtered.length - 1 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-primary">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
