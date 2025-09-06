import { LoginForm } from "@/components/auth/login-form"
import { Breadcrumb } from "@/components/breadcrumb"
import Link from "next/link"

export default function LoginPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Login", href: "/auth/login" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-12">
        <Breadcrumb items={breadcrumbItems} />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your MarketPlace account</p>
        </div>

        <LoginForm />

        <div className="text-center mt-6">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
