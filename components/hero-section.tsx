export function HeroSection() {
  return (
    <section className="relative w-full">
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      <img
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/new%20hero%20image-OXnsbDXjsMbKTffkEil4DSYOTqnjMi.webp"
        alt="Canada's Fastest Growing Ads Marketplace"
        className="w-full h-64 md:h-80 object-cover"
      />

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-6 text-shadow-lg">
          Canada's Fastest Growing
          <br />
          Ads Marketplace
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-2xl">
          <input
            type="text"
            placeholder="Find anything in Canada"
            className="flex-1 px-6 py-3 rounded-full text-gray-900 text-lg"
          />
          <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-colors">
            Post Ad
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center text-gray-900">
            <div className="text-green-600 mb-2">✓</div>
            <div className="font-semibold">Unlimited Ads</div>
            <div className="text-sm">(Free)</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center text-gray-900">
            <div className="text-green-600 mb-2">🔗</div>
            <div className="font-semibold">Add Website URL</div>
            <div className="text-sm">(Free)</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center text-gray-900">
            <div className="text-green-600 mb-2">📹</div>
            <div className="font-semibold">Add YouTube Video URL</div>
            <div className="text-sm">(Free)</div>
          </div>
        </div>
      </div>
    </section>
  )
}
