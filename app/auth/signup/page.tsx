import { SignupForm } from "@/components/auth/signup-form"
import { Breadcrumb } from "@/components/breadcrumb"
import { Camera, Heart, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumb items={breadcrumbItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-4">
          {/* Left Side - Signup Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create Account
              </h1>
              <p className="text-sm text-gray-600">
                Join MarketPlace to start buying and selling today.
              </p>
            </div>
            <SignupForm />
          </div>

          {/* Right Side - Benefits */}
          <div className="hidden lg:flex flex-col justify-center min-h-[500px] bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8">
            <div className="w-full">
              {/* Logo */}
              <div className="mb-6">
                <Link href="/">
                  <span className="text-4xl font-bold text-green-800">
                    MarketPlace
                  </span>
                </Link>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Unlock the full MarketPlace experience
              </h2>

              {/* Benefits List */}
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 pt-1.5">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Create unlimited free ads and reach thousands of buyers
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 pt-1.5">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Save your favorite items and view them anytime, anywhere
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 pt-1.5">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Connect with buyers and sellers directly through our messaging system
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
