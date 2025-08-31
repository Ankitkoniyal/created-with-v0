"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Home, Eye } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function SellSuccessPage() {
  const [successMessage, setSuccessMessage] = useState("Your product has been successfully listed!")
  const searchParams = useSearchParams()
  const adId = searchParams.get("id")

  useEffect(() => {
    const storedMessage = sessionStorage.getItem("adPostSuccess")
    if (storedMessage) {
      setSuccessMessage(storedMessage)
      sessionStorage.removeItem("adPostSuccess")
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Listing Published!</h1>
              <p className="text-muted-foreground">{successMessage}</p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/dashboard/listings">
                  <Eye className="h-4 w-4 mr-2" />
                  View My Listings
                </Link>
              </Button>

              {adId && (
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href={`/product/${adId}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Your Ad
                  </Link>
                </Button>
              )}

              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/sell">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Sell Another Item
                </Link>
              </Button>

              <Button variant="ghost" asChild className="w-full">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Homepage
                </Link>
              </Button>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-sm mb-2">What happens next?</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Your listing is now live and searchable</li>
                <li>• Buyers can contact you through our messaging system</li>
                <li>• You'll receive notifications for any inquiries</li>
                <li>• You can manage your ads from the dashboard</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
