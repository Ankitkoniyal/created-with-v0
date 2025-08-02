// app/my-ads/confirmation/page.tsx
import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/utils/supabaseServer"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, MapPin } from "lucide-react"

// A simple card to display the ad preview on the confirmation page
function AdPreviewCard({ ad }: { ad: any }) {
  const formatPrice = (price: number | null) => {
    if (price === null) return "Price on request"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Card className="flex flex-col md:flex-row p-4">
      <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0">
        <Image
          src={ad.images?.[0] || "/placeholder.svg"}
          alt={ad.title}
          fill
          className="object-cover rounded-md"
        />
      </div>
      <div className="flex-1 mt-4 md:mt-0 md:ml-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold line-clamp-1">{ad.title}</h3>
          {ad.condition && (
            <Badge variant="secondary">{ad.condition}</Badge>
          )}
        </div>
        <p className="text-2xl font-bold text-blue-600 my-2">{formatPrice(ad.price)}</p>
        <p className="text-sm text-gray-500 line-clamp-2">{ad.description}</p>
        <div className="flex items-center text-sm text-gray-500 mt-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{ad.location}</span>
        </div>
      </div>
    </Card>
  )
}

export default async function AdConfirmationPage({ searchParams }: { searchParams: { adId: string } }) {
  // Check for the adId parameter
  const { adId } = searchParams
  if (!adId) {
    redirect("/my-ads") // Redirect if no ad ID is provided
  }

  // Fetch the ad details from Supabase
  const { data: ad, error } = await supabase
    .from("ads")
    .select("*")
    .eq("id", adId)
    .single()

  if (error || !ad) {
    console.error("Failed to fetch ad for confirmation:", error)
    notFound() // Show 404 page if ad not found or error occurred
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="text-center p-8 shadow-md">
          <div className="flex flex-col items-center justify-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-bold text-gray-800">Ad Posted Successfully!</CardTitle>
            <CardDescription className="mt-2 text-lg text-gray-600">
              Your ad has been successfully created and is now live.
            </CardDescription>
          </div>
          
          <div className="mt-8">
            <h3 className="text-left text-xl font-semibold mb-4">Your Ad Preview:</h3>
            <AdPreviewCard ad={ad} />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild>
              <Link href={`/ad/${ad.id}`}>View My Ad</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/my-ads">View All My Ads</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}