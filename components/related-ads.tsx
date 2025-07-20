"use client"

import { useMemo } from "react"
import { ImprovedAdCard } from "@/components/improved-ad-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getAllAds } from "@/lib/mock-data"
import type { Ad } from "@/lib/mock-data"

interface RelatedAdsProps {
  currentAd: Ad
  maxAds?: number
}

export function RelatedAds({ currentAd, maxAds = 6 }: RelatedAdsProps) {
  const related = useMemo(() => {
    const all = getAllAds().filter((ad) => ad.id !== currentAd.id && ad.status === "active")

    // 1️⃣ Same category gets priority
    const byCategory = all.filter((ad) => ad.category === currentAd.category)

    // 2️⃣ Similar keywords in title / description
    const words = currentAd.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)

    const byKeywords = all.filter(
      (ad) =>
        words.some((w) => ad.title.toLowerCase().includes(w)) ||
        words.some((w) => ad.description?.toLowerCase().includes(w)),
    )

    // De-duplicate
    const merged: Ad[] = []
    for (const ad of [...byCategory, ...byKeywords]) {
      if (!merged.find((a) => a.id === ad.id)) merged.push(ad)
    }

    return merged.slice(0, maxAds)
  }, [currentAd, maxAds])

  if (!related.length) return null

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Related Ads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {related.map((ad) => (
            <ImprovedAdCard ad={ad} key={ad.id} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
