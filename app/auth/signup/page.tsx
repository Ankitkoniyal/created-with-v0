import { SignupForm } from "@/components/auth/signup-form"
import { Breadcrumb } from "@/components/breadcrumb"
import Link from "next/link"

export default function SignupPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Sign Up", href: "/auth/signup" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-12">
        <Breadcrumb items={breadcrumbItems} />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Join MarketPlace</h1>
          <p className="text-muted-foreground">Create your account to start buying and selling</p>
        </div>

        <SignupForm />

        <div className="text-center mt-6">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
