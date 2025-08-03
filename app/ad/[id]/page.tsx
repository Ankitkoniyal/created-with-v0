// app/ad/[id]/page.tsx
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/utils/supabaseServer"
import { Navbar } from "@/components/navbar"
import { UserProfileSection } from "@/components/user-profile-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, ArrowLeft, Shield } from "lucide-react"

// Types for ad and profile data from Supabase
interface Ad {
  id: string
  title: string
  description: string
  price: number | null
  negotiable: boolean
  condition: string
  location: string
  created_at: string
  images: string[]
  profiles: {
    id: string
    full_name: string
    mobile: string | null
    email: string | null
  } | null
}

export default async function AdDetailPage({ params }: { params: { id: string } }) {
  // Create a new Supabase client for each request
  const supabase = createClient()
  console.log("--- New code is running in page.tsx ---");
  const adId = await params.id

  // If the adId is not a valid string, immediately show a 404 page.
  if (!adId || adId === "") {
    console.error("Ad ID is invalid:", adId)
    notFound()
  }

  const { data: ad, error } = await supabase
    .from("ads")
    .select(
      `
      id,
      title,
      description,
      price,
      negotiable,
      condition,
      location,
      created_at,
      images,
      profiles (
        id,
        full_name,
        mobile,
        email
      )
    `
    )
    .eq("id", adId)
    .single()

  if (error || !ad) {
    console.error("Ad not found:", error)
    notFound()
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCondition = (condition: string) => {
    switch (condition) {
      case "second_hand":
        return "Second Hand"
      case "like_new":
        return "Like New"
      case "new":
        return "New"
      default:
        return condition
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/" className="flex items-center gap-2 hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ad Details and Images */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl mb-3">{ad.title}</CardTitle>
                <p className="text-3xl font-bold text-blue-600 mb-2">{formatPrice(ad.price)}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {ad.location}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Posted on {formatDate(ad.created_at)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {ad.images && ad.images.length > 0 ? (
                    ad.images.map((image, index) => (
                      <div key={index} className="aspect-video relative rounded-lg overflow-hidden">
                        <Image
                          src={image}
                          alt={`${ad.title} image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500">
                      <span>No Image Available</span>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">{ad.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Information */}
            {ad.profiles && (
              <UserProfileSection user={ad.profiles} />
            )}

            {/* Safety Tips */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                  Safety Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• Meet in a safe, public location</p>
                <p>• Inspect the item before payment</p>
                <p>• Don't share personal financial information</p>
                <p>• Trust your instincts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}