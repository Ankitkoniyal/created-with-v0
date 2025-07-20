"use client"

import { Navbar } from "@/components/navbar"
import { HeroBanner } from "@/components/hero-banner"
import { ModernCategorySection } from "@/components/modern-category-section"
import { ImprovedAdCard } from "@/components/improved-ad-card"
import { Button } from "@/components/ui/button"
import { getAllAds } from "@/lib/mock-data"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const [ads, setAds] = useState<any[]>([])
  const [displayedAds, setDisplayedAds] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const adsPerPage = 20

  useEffect(() => {
    // Get ads from localStorage + mock data
    const allAds = getAllAds()
    const activeAds = allAds
      .filter((ad) => ad.status === "active")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setAds(activeAds)
    setDisplayedAds(activeAds.slice(0, adsPerPage))
  }, [])

  const hasMoreAds = displayedAds.length < ads.length

  const loadMoreAds = async () => {
    setLoading(true)

    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const nextPage = currentPage + 1
    const startIndex = 0
    const endIndex = nextPage * adsPerPage

    setDisplayedAds(ads.slice(startIndex, endIndex))
    setCurrentPage(nextPage)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <HeroBanner />
      <ModernCategorySection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Recent Ads Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Recent Ads</h2>
              <p className="text-gray-600 mt-1">
                Showing {displayedAds.length} of {ads.length} ads
              </p>
            </div>
            <a href="/search" className="text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </a>
          </div>

          {displayedAds.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedAds.map((ad) => (
                  <ImprovedAdCard key={ad.id} ad={ad} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMoreAds && (
                <div className="flex justify-center mt-12">
                  <Button
                    onClick={loadMoreAds}
                    disabled={loading}
                    size="lg"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      `Load More Ads (${ads.length - displayedAds.length} remaining)`
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No ads available at the moment.</p>
              <p className="text-gray-400 mt-2">Be the first to post an ad!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
