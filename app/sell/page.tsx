import { PostProductForm } from "@/components/post-product-form"
import { Breadcrumb } from "@/components/breadcrumb"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function SellPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Sell Product", href: "/sell" },
  ]

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Sell Your Product</h1>
            <p className="text-muted-foreground">Create a listing to reach millions of potential buyers</p>
          </div>
          <PostProductForm />
        </div>
      </div>
    </AuthGuard>
  )
}
