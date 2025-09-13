"use client"
import NextLink from "next/link"
import { Upload, LinkIcon, Video, Rocket, TrendingUp, Users, Star, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative w-full py-12 sm:py-16 px-4 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-green-500 rounded-full mix-blend-soft-light filter blur-3xl animate-pulse-slow opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-soft-light filter blur-3xl animate-pulse-slow opacity-15 delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-teal-300 rounded-full mix-blend-soft-light filter blur-3xl animate-pulse-slow opacity-10 delay-2000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative max-w-6xl mx-auto text-center z-10">
        {/* Badge */}
        <div className={`inline-flex items-center gap-2 bg-green-900/20 backdrop-blur-sm border border-green-700/30 rounded-full px-4 py-1.5 mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-300">#Fastest Growing Marketplace in Canada</span>
        </div>

        {/*  Heading - Single Line */}
      <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-10 leading-tight transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
   Post Unlimited Ads {" "}
  </span>
</h1> 

        {/* Stats */}
        <div className={`flex flex-wrap justify-center gap-6 mb-10 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-green-400" />
            <span className="font-semibold">100K+</span>
            <span className="text-gray-400">Users</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Rocket className="w-5 h-5 text-green-400" />
            <span className="font-semibold">5K+</span>
            <span className="text-gray-400">Active Ads</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Star className="w-5 h-5 text-green-400" />
            <span className="font-semibold">98%</span>
            <span className="text-gray-400">Satisfaction</span>
          </div>
        </div>

        {/* Feature Sections */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 text-center border border-white/10 hover:border-green-400/30 transition-all duration-300 hover:scale-105">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-900/20 rounded-full mb-4 mx-auto">
              <Upload className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Unlimited Free Ads</h3>
            <p className="text-sm text-gray-300">Publish as many ads as you need to grow your business.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 text-center border border-white/10 hover:border-green-400/30 transition-all duration-300 hover:scale-105">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-900/20 rounded-full mb-4 mx-auto">
              <LinkIcon className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Website Links</h3>
            <p className="text-sm text-gray-300">Drive traffic to your site with direct links in your ads.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 text-center border border-white/10 hover:border-green-400/30 transition-all duration-300 hover:scale-105">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-900/20 rounded-full mb-4 mx-auto">
              <Video className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Video Integration</h3>
            <p className="text-sm text-gray-300">Showcase your products with embedded YouTube videos.</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className={`transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 px-8 h-12 rounded-xl font-semibold text-base shadow-lg shadow-green-900/30 hover:shadow-green-900/50 transition-all duration-300 hover:scale-105 group"
          >
            <NextLink href="/sell" className="flex items-center">
              <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              Start Selling Now - It's Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </NextLink>
          </Button>
        </div>

        {/* Trust indicator */}
        <p className={`text-sm text-gray-400 mt-6 transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          No credit card required • Set up in minutes • 100% free forever
        </p>
      </div>
    </section>
  )
}
