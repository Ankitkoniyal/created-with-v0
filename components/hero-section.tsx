"use client"
import NextLink from "next/link"
import { Upload, LinkIcon, Video } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative w-full py-14 sm:py-16 px-4 overflow-hidden bg-gray-950">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-800 via-transparent to-transparent animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-green-700 via-transparent to-transparent animate-pulse-slow delay-500"></div>
      </div>

      <div className="relative max-w-6xl mx-auto text-center z-10">
        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-8 whitespace-normal md:whitespace-nowrap">
          {"Canada's Fastest Growing "}
          <span
            className="text-green-900"
            style={{
              // subtle multi-layer white shadow to create a 3D/embossed feel without any outline border
              textShadow: "0 1px 0 rgba(255,255,255,0.95), 0 2px 0 rgba(255,255,255,0.6), 0 3px 2px rgba(0,0,0,0.2)",
            }}
          >
            {"Ads Marketplace"}
          </span>
        </h1>

        {/* Feature Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto mb-10">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <Upload className="w-6 h-6 text-green-900 mb-2 mx-auto" />
            <h3 className="font-semibold text-sm text-gray-900">Unlimited Ads (Free)</h3>
            <p className="text-xs text-gray-600">Publish as many ads as you need to grow your business.</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <LinkIcon className="w-6 h-6 text-green-900 mb-2 mx-auto" />
            <h3 className="font-semibold text-sm text-gray-900">Website URL (Free)</h3>
            <p className="text-xs text-gray-600">Drive traffic to your site with a direct link.</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <Video className="w-6 h-6 text-green-900 mb-2 mx-auto" />
            <h3 className="font-semibold text-sm text-gray-900">YouTube Video (Free)</h3>
            <p className="text-xs text-gray-600">Showcase your products or services with a video.</p>
          </div>
        </div>

        <Button
          asChild
          variant="default"
          size="md"
          className="bg-green-900 text-white hover:bg-green-950 px-6 h-10 text-sm rounded-md border border-white/80"
        >
          <NextLink href="/sell">Post Free Ads Now</NextLink>
        </Button>
      </div>
    </section>
  )
}
