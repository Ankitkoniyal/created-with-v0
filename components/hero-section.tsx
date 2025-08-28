import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-green-600 to-green-800 py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Canada's Fastest Growing
              <br />
              <span className="text-green-200">Ads Marketplace</span>
            </h1>
            <p className="text-xl text-green-100 mb-8 max-w-lg">
              Buy, sell, and connect with millions of Canadians. Find anything you need or sell what you don't.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-full p-2 flex items-center gap-2 mb-8 shadow-lg">
              <div className="flex-1 px-4">
                <input
                  type="text"
                  placeholder="Find anything in Canada"
                  className="w-full py-3 text-gray-700 placeholder-gray-500 bg-transparent border-none outline-none text-lg"
                />
              </div>
              <Button size="lg" className="bg-green-600 hover:bg-green-700 rounded-full px-8">
                Post Ad
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-800 font-bold">✓</span>
                </div>
                <h3 className="font-semibold text-green-100">Upload Unlimited</h3>
                <p className="text-sm text-green-200">Ads (Free)</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-800 font-bold">🔗</span>
                </div>
                <h3 className="font-semibold text-green-100">Add Website</h3>
                <p className="text-sm text-green-200">URL (Free)</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-800 font-bold">📹</span>
                </div>
                <h3 className="font-semibold text-green-100">Add YouTube</h3>
                <p className="text-sm text-green-200">Video URL (Free)</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/marketplace%20optimized-uCF2i5C1O3lBv91kpGKwI9aquSrgs5.webp"
              alt="Diverse group of people using marketplace - Canada's fastest growing ads marketplace"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
